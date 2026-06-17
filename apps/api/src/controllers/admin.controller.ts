import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";

export const analytics = asyncHandler(async (_request, response) => {
  const [[revenue], [rentals], [lateReturns], [refunds], topCategories, topSellers] = await Promise.all([
    pool.query<any[]>("SELECT COALESCE(SUM(rental_fee), 0) AS totalRevenue FROM orders WHERE status <> 'cancelled'"),
    pool.query<any[]>("SELECT COUNT(*) AS totalRentals, SUM(status = 'active') AS activeRentals FROM rentals"),
    pool.query<any[]>("SELECT COUNT(*) AS lateReturns FROM rentals WHERE status = 'active' AND end_date < CURRENT_DATE()"),
    pool.query<any[]>("SELECT COUNT(*) AS refundRequests FROM refunds WHERE status IN ('pending', 'approved')"),
    pool.query<any[]>(
      `SELECT c.name, COUNT(*) AS rentals FROM rentals r
       JOIN products p ON p.id = r.product_id
       JOIN categories c ON c.id = p.category_id
       GROUP BY c.id ORDER BY rentals DESC LIMIT 5`
    ),
    pool.query<any[]>(
      `SELECT s.store_name, COUNT(*) AS rentals FROM rentals r
       JOIN sellers s ON s.id = r.seller_id
       GROUP BY s.id ORDER BY rentals DESC LIMIT 5`
    )
  ]);

  ok(response, {
    totalRevenue: revenue[0].totalRevenue,
    totalRentals: rentals[0].totalRentals,
    activeRentals: rentals[0].activeRentals,
    lateReturns: lateReturns[0].lateReturns,
    refundRequests: refunds[0].refundRequests,
    topCategories,
    topSellers
  });
});

export const approveSeller = asyncHandler(async (request, response) => {
  await pool.execute("UPDATE sellers SET approval_status = 'approved', approved_at = NOW() WHERE id = :id", { id: request.params.id });
  ok(response, { message: "Seller approved" });
});

export const approveProduct = asyncHandler(async (request, response) => {
  await pool.execute("UPDATE products SET approval_status = 'approved', status = 'active' WHERE id = :id", { id: request.params.id });
  ok(response, { message: "Product approved" });
});

export const resolveDispute = asyncHandler(async (request, response) => {
  const body = z.object({ decision: z.enum(["full_refund", "partial_refund", "no_refund"]), notes: z.string().min(3) }).parse(request.body);
  await pool.execute("UPDATE disputes SET status = 'resolved', admin_decision = :decision, admin_notes = :notes, resolved_at = NOW() WHERE id = :id", {
    id: request.params.id,
    ...body
  });
  ok(response, { message: "Dispute resolved" });
});

export const platformSettings = asyncHandler(async (_request, response) => {
  ok(response, {
    brand: "Lendora",
    slogan: "Rent Smart. Return Easy.",
    lateReturnPolicy: [
      "1-3 days: 5%",
      "4-7 days: 15%",
      "8-14 days: 30%",
      "15-30 days: 50%",
      "More than 30 days: 100%"
    ]
  });
});
