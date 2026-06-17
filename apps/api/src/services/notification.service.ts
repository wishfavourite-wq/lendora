import { pool } from "../config/db.js";

export async function notifyUser(userId: number, title: string, body: string, type = "dashboard") {
  await pool.execute(
    "INSERT INTO notifications (user_id, title, body, type) VALUES (:userId, :title, :body, :type)",
    { userId, title, body, type }
  );
}
