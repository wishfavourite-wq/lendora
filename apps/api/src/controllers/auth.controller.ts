import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { asyncHandler, ok, ApiError } from "../utils/http.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  role: z.enum(["seller", "customer"]).default("customer")
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8)
});

function signToken(user: { id: number; email: string; role: "admin" | "seller" | "customer" }) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "7d" });
}

function signRefreshToken(user: { id: number; email: string; role: "admin" | "seller" | "customer" }) {
  return jwt.sign(user, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

async function createRefreshTokenForUser(userId: number) {
  const token = crypto.randomBytes(48).toString("hex");
  await pool.execute("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (:userId, :token, DATE_ADD(NOW(), INTERVAL 30 DAY))", {
    userId,
    token
  });
  return token;
}

export const register = asyncHandler(async (request, response) => {
  const body = registerSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(body.password, 12);

  const [existing] = await pool.execute<any[]>("SELECT id FROM users WHERE email = :email OR phone = :phone", {
    email: body.email,
    phone: body.phone
  });

  if (existing.length > 0) throw new ApiError(409, "Account already exists");

  const [roleRows] = await pool.execute<any[]>("SELECT id FROM roles WHERE name = :role", { role: body.role });
  const roleId = roleRows[0]?.id;
  if (!roleId) throw new ApiError(500, "Role is not configured");

  const [result] = await pool.execute<any>(
    "INSERT INTO users (role_id, name, email, phone, password_hash) VALUES (:roleId, :name, :email, :phone, :passwordHash)",
    { roleId, name: body.name, email: body.email, phone: body.phone, passwordHash }
  );

  if (body.role === "seller") {
    await pool.execute("INSERT INTO sellers (user_id, store_name, approval_status) VALUES (:userId, :storeName, 'pending')", {
      userId: result.insertId,
      storeName: `${body.name}'s Rentals`
    });
  } else {
    await pool.execute("INSERT INTO customers (user_id) VALUES (:userId)", { userId: result.insertId });
  }

  const accessToken = signToken({ id: result.insertId, email: body.email, role: body.role });
  const refreshToken = await createRefreshTokenForUser(result.insertId);
  ok(response, { token: accessToken, refreshToken, user: { id: result.insertId, name: body.name, email: body.email, role: body.role } }, 201);
});

export const login = asyncHandler(async (request, response) => {
  const body = loginSchema.parse(request.body);
  const [rows] = await pool.execute<any[]>(
    `SELECT u.id, u.name, u.email, u.phone, u.password_hash, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = :identifier OR u.phone = :identifier
     LIMIT 1`,
    { identifier: body.identifier }
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new ApiError(401, "Invalid login credentials");
  }

  const accessToken = signToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = await createRefreshTokenForUser(user.id);
  ok(response, { token: accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

export const refreshAccessToken = asyncHandler(async (request, response) => {
  const { refreshToken } = request.body as { refreshToken?: string };
  if (!refreshToken) throw new ApiError(400, "refreshToken is required");

  const [rows] = await pool.execute<any[]>("SELECT * FROM refresh_tokens WHERE token = :token AND revoked = 0 AND expires_at > NOW() LIMIT 1", {
    token: refreshToken
  });
  const row = rows[0];
  if (!row) throw new ApiError(401, "Invalid or expired refresh token");

  const [userRows] = await pool.execute<any[]>("SELECT u.id, u.email, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = :id LIMIT 1", {
    id: row.user_id
  });
  const user = userRows[0];
  if (!user) throw new ApiError(404, "User not found");

  // Rotate: revoke old token and issue a new one
  await pool.execute("UPDATE refresh_tokens SET revoked = 1 WHERE id = :id", { id: row.id });
  const newRefresh = await createRefreshTokenForUser(user.id);
  const accessToken = signToken({ id: user.id, email: user.email, role: user.role });
  ok(response, { token: accessToken, refreshToken: newRefresh });
});

export const logout = asyncHandler(async (request, response) => {
  const { refreshToken } = request.body as { refreshToken?: string };
  if (!refreshToken) return ok(response, { message: "Logged out" });
  await pool.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token = :token", { token: refreshToken });
  ok(response, { message: "Logged out" });
});

export const me = asyncHandler(async (request, response) => {
  const [rows] = await pool.execute<any[]>(
    `SELECT u.id, u.name, u.email, u.phone, r.name AS role, u.email_verified_at, u.phone_verified_at
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = :id`,
    { id: request.user?.userId }
  );
  ok(response, rows[0]);
});

export const requestPasswordReset = asyncHandler(async (request, response) => {
  const body = z.object({ identifier: z.string().min(3) }).parse(request.body);
  const [rows] = await pool.execute<any[]>("SELECT id, email FROM users WHERE email = :identifier OR phone = :identifier LIMIT 1", {
    identifier: body.identifier
  });
  const user = rows[0];
  if (!user) return ok(response, { message: "If an account exists, a reset link will be sent." });

  const token = crypto.randomBytes(32).toString("hex");
  await pool.execute("INSERT INTO password_resets (user_id, token, expires_at) VALUES (:userId, :token, DATE_ADD(NOW(), INTERVAL 1 HOUR))", {
    userId: user.id,
    token
  });

  // In production, send email/SMS with the token link. For development return the token.
  ok(response, { message: "Password reset token generated", token });
});

export const confirmPasswordReset = asyncHandler(async (request, response) => {
  const body = z.object({ token: z.string().min(10), password: z.string().min(8) }).parse(request.body);
  const [rows] = await pool.execute<any[]>("SELECT * FROM password_resets WHERE token = :token AND used = 0 AND expires_at > NOW() LIMIT 1", {
    token: body.token
  });
  const row = rows[0];
  if (!row) throw new ApiError(400, "Invalid or expired token");

  const passwordHash = await bcrypt.hash(body.password, 12);
  await pool.execute("UPDATE users SET password_hash = :passwordHash WHERE id = :id", { passwordHash, id: row.user_id });
  await pool.execute("UPDATE password_resets SET used = 1 WHERE id = :id", { id: row.id });

  ok(response, { message: "Password has been reset" });
});

export const verifyEmail = asyncHandler(async (request, response) => {
  await pool.execute("UPDATE users SET email_verified_at = NOW() WHERE id = :id", { id: request.user?.userId });
  ok(response, { message: "Email verified" });
});
