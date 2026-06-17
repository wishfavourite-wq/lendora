import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";

export const listMessages = asyncHandler(async (request, response) => {
  const [rows] = await pool.execute(
    `SELECT * FROM messages
     WHERE order_id = :orderId
     ORDER BY created_at ASC`,
    { orderId: request.params.orderId }
  );
  ok(response, rows);
});

export const sendMessage = asyncHandler(async (request, response) => {
  const body = z.object({ orderId: z.coerce.number().int().positive(), receiverId: z.coerce.number().int().positive(), body: z.string().min(1) }).parse(request.body);
  await pool.execute(
    "INSERT INTO messages (order_id, sender_id, receiver_id, body) VALUES (:orderId, :senderId, :receiverId, :body)",
    { ...body, senderId: request.user?.userId }
  );
  ok(response, { message: "Message sent" }, 201);
});
