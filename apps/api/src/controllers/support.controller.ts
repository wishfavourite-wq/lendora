import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";

export const createTicket = asyncHandler(async (request, response) => {
  const body = z.object({ subject: z.string().min(3), body: z.string().min(10) }).parse(request.body);
  await pool.execute("INSERT INTO support_tickets (user_id, subject, body, status) VALUES (:userId, :subject, :body, 'open')", {
    userId: request.user?.userId,
    ...body
  });
  ok(response, { message: "Support ticket created" }, 201);
});

export const listTickets = asyncHandler(async (_request, response) => {
  const [rows] = await pool.query("SELECT * FROM support_tickets ORDER BY created_at DESC");
  ok(response, rows);
});

export const updateTicket = asyncHandler(async (request, response) => {
  const body = z.object({ status: z.enum(["open", "pending", "solved"]) }).parse(request.body);
  await pool.execute("UPDATE support_tickets SET status = :status WHERE id = :id", { id: request.params.id, ...body });
  ok(response, { message: "Ticket updated" });
});
