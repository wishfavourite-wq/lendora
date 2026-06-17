import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";

export const listRefunds = asyncHandler(async (_request, response) => {
  const [rows] = await pool.query(
    `SELECT rf.*, d.order_id FROM refunds rf
     JOIN deposits d ON d.id = rf.deposit_id
     ORDER BY rf.created_at DESC`
  );
  ok(response, rows);
});

export const approveRefund = asyncHandler(async (request, response) => {
  await pool.execute("UPDATE refunds SET status = 'paid', processed_at = NOW() WHERE id = :id", { id: request.params.id });
  ok(response, { message: "Refund marked as paid" });
});
