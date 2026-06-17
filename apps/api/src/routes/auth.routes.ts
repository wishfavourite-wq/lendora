import { Router } from "express";
import {
	login,
	me,
	register,
	requestPasswordReset,
	verifyEmail,
	confirmPasswordReset,
	refreshAccessToken,
	logout
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
// Request a password reset token (email/phone)
authRouter.post("/password/reset", requestPasswordReset);
// Confirm password reset with token
authRouter.post("/password/reset/confirm", confirmPasswordReset);
// Access current user
authRouter.get("/me", requireAuth, me);
// Email verification (authenticated)
authRouter.post("/verify-email", requireAuth, verifyEmail);
// Refresh access token using refresh token
authRouter.post("/refresh", refreshAccessToken);
// Revoke refresh token / logout
authRouter.post("/logout", requireAuth, logout);
