import { z } from "zod";
import { pool, withTransaction } from "../config/db.js";
import { asyncHandler, ok, ApiError } from "../utils/http.js";
import { calculateLateDepositDeduction } from "../services/late-fee.service.js";
import { notifyUser } from "../services/notification.service.js";

const rentalSchema = z.object({
  productId: z.coerce.number().int().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  rentalType: z.enum(["daily", "weekly", "monthly"])
});

export const createRental = asyncHandler(async (request, response) => {
  const body = rentalSchema.parse(request.body);

  const orderId = await withTransaction(async (connection) => {
    const [conflicts] = await connection.execute<any[]>(
      `SELECT id FROM rentals
       WHERE product_id = :productId
       AND status IN ('approved', 'active')
       AND start_date <= :endDate AND end_date >= :startDate`,
      body
    );
    if (conflicts.length > 0) throw new ApiError(409, "Product is already booked for these dates");

    const [products] = await connection.execute<any[]>("SELECT * FROM products WHERE id = :productId AND approval_status = 'approved'", body);
    const product = products[0];
    if (!product) throw new ApiError(404, "Product not available");

    const days = Math.max(1, Math.ceil((Date.parse(body.endDate) - Date.parse(body.startDate)) / 86400000) + 1);
    if (days > product.max_rental_duration) throw new ApiError(422, "Rental duration exceeds seller limit");

    const rentalFee = body.rentalType === "monthly"
      ? Math.ceil(days / 30) * product.monthly_rent
      : body.rentalType === "weekly"
        ? Math.ceil(days / 7) * product.weekly_rent
        : days * product.daily_rent;
    const totalAmount = rentalFee + product.security_deposit;

    const [order] = await connection.execute<any>(
      `INSERT INTO orders (customer_id, seller_id, product_id, total_amount, rental_fee, deposit_amount, status)
       VALUES (:customerId, :sellerId, :productId, :totalAmount, :rentalFee, :depositAmount, 'placed')`,
      {
        customerId: request.user?.userId,
        sellerId: product.seller_id,
        productId: body.productId,
        totalAmount,
        rentalFee,
        depositAmount: product.security_deposit
      }
    );

    await connection.execute(
      `INSERT INTO rentals (order_id, customer_id, seller_id, product_id, rental_type, start_date, end_date, status)
       VALUES (:orderId, :customerId, :sellerId, :productId, :rentalType, :startDate, :endDate, 'pending')`,
      { orderId: order.insertId, customerId: request.user?.userId, sellerId: product.seller_id, ...body }
    );

    await connection.execute(
      "INSERT INTO deposits (order_id, amount, held_amount, status) VALUES (:orderId, :amount, :heldAmount, 'held')",
      { orderId: order.insertId, amount: product.security_deposit, heldAmount: product.security_deposit }
    );

    return order.insertId as number;
  });

  await notifyUser(Number(request.user!.userId), "Order placed", `Order #${orderId} is awaiting payment.`);
  ok(response, { orderId }, 201);
});

export const listMyRentals = asyncHandler(async (request, response) => {
  const [rows] = await pool.execute(
    `SELECT r.*, p.name AS product_name, o.total_amount, o.status AS order_status
     FROM rentals r
     JOIN products p ON p.id = r.product_id
     JOIN orders o ON o.id = r.order_id
     WHERE r.customer_id = :userId OR r.seller_id IN (SELECT id FROM sellers WHERE user_id = :userId)
     ORDER BY r.created_at DESC`,
    { userId: request.user?.userId }
  );
  ok(response, rows);
});

export const extendRental = asyncHandler(async (request, response) => {
  const body = z.object({ newEndDate: z.string().date(), additionalRent: z.coerce.number().positive() }).parse(request.body);
  await pool.execute(
    "INSERT INTO rental_extensions (rental_id, requested_end_date, additional_rent, status) VALUES (:rentalId, :newEndDate, :additionalRent, 'pending_payment')",
    { rentalId: request.params.id, ...body }
  );
  ok(response, { message: "Extension requested. Additional rent payment is required." });
});

export const requestReturn = asyncHandler(async (request, response) => {
  await pool.execute("INSERT INTO returns (rental_id, requested_by, status) VALUES (:rentalId, :userId, 'requested')", {
    rentalId: request.params.id,
    userId: request.user?.userId
  });
  ok(response, { message: "Return request submitted" });
});

export const approveHandover = asyncHandler(async (request, response) => {
  const result = await withTransaction(async (connection) => {
    const [rows] = await connection.execute<any[]>(
      `SELECT r.id, r.order_id, o.status AS order_status, p.seller_id
       FROM rentals r
       JOIN orders o ON o.id = r.order_id
       JOIN products p ON p.id = r.product_id
       WHERE r.id = :rentalId FOR UPDATE`,
      { rentalId: request.params.id }
    );
    const rental = rows[0];
    if (!rental) throw new ApiError(404, "Rental not found");
    if (rental.order_status !== "payment_completed") throw new ApiError(422, "Payment not completed for this order");

    await connection.execute("UPDATE orders SET status = 'seller_approved' WHERE id = :orderId", { orderId: rental.order_id });
    await connection.execute("UPDATE rentals SET status = 'active' WHERE id = :rentalId", { rentalId: request.params.id });
    return { rentalId: rental.id };
  });

  await notifyUser(Number(request.user!.userId), "Rental started", `Rental #${result.rentalId} is now active.`);
  ok(response, { message: "Handover approved and rental is active" });
});

export const approveReturn = asyncHandler(async (request, response) => {
  const result = await withTransaction(async (connection) => {
    const [rows] = await connection.execute<any[]>(
      `SELECT r.id, r.order_id, r.end_date, d.id AS deposit_id, d.held_amount
       FROM rentals r JOIN deposits d ON d.order_id = r.order_id
       WHERE r.id = :rentalId FOR UPDATE`,
      { rentalId: request.params.id }
    );
    const rental = rows[0];
    if (!rental) throw new ApiError(404, "Rental not found");

    const daysLate = Math.ceil((Date.now() - Date.parse(rental.end_date)) / 86400000);
    const penalty = calculateLateDepositDeduction(daysLate, rental.held_amount);

    await connection.execute("UPDATE rentals SET status = 'completed' WHERE id = :rentalId", { rentalId: request.params.id });
    await connection.execute("UPDATE returns SET status = 'approved', approved_at = NOW() WHERE rental_id = :rentalId", {
      rentalId: request.params.id
    });
    await connection.execute(
      "INSERT INTO refunds (deposit_id, amount, deduction_amount, reason, status) VALUES (:depositId, :amount, :deduction, 'late_return_policy', 'approved')",
      { depositId: rental.deposit_id, amount: penalty.refundableAmount, deduction: penalty.deduction }
    );
    await connection.execute("UPDATE deposits SET held_amount = 0, refunded_amount = :amount, status = 'released' WHERE id = :depositId", {
      depositId: rental.deposit_id,
      amount: penalty.refundableAmount
    });
    return penalty;
  });

  ok(response, { message: "Return approved and refund calculated", penalty: result });
});

