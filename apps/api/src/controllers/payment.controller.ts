import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";
import { createBkashPayment, executeBkashPayment } from "../services/bkash.service.js";
import { notifyUser } from "../services/notification.service.js";
import { withTransaction } from "../config/db.js";

export const createPayment = asyncHandler(async (request, response) => {
  const body = z.object({ orderId: z.coerce.number().int().positive() }).parse(request.body);
  const [orders] = await pool.execute<any[]>("SELECT total_amount FROM orders WHERE id = :orderId", body);
  const payment = await createBkashPayment({
    orderId: body.orderId,
    amount: orders[0]?.total_amount ?? 0,
    payerReference: String(request.user?.userId)
  });
  await pool.execute(
    "INSERT INTO payments (order_id, gateway, amount, status, gateway_payload) VALUES (:orderId, 'bkash', :amount, 'initiated', :payload)",
    { orderId: body.orderId, amount: payment.amount, payload: JSON.stringify(payment) }
  );
  ok(response, payment, 201);
});

export const executePayment = asyncHandler(async (request, response) => {
  const body = z.object({ paymentId: z.string().min(1), orderId: z.coerce.number().int().positive() }).parse(request.body);
  const result = await executeBkashPayment(body.paymentId);
  await pool.execute("UPDATE payments SET status = 'paid', transaction_id = :paymentId WHERE order_id = :orderId", body);
  await pool.execute("UPDATE orders SET status = 'payment_completed' WHERE id = :orderId", body);
  await notifyUser(Number(request.user!.userId), "Payment success", `Payment completed for order #${body.orderId}.`);
  ok(response, result);
});

export const createExtensionPayment = asyncHandler(async (request, response) => {
  const body = z.object({ extensionId: z.coerce.number().int().positive() }).parse(request.body);
  const [extRows] = await pool.execute<any[]>(
    `SELECT re.*, r.order_id, r.product_id FROM rental_extensions re JOIN rentals r ON r.id = re.rental_id WHERE re.id = :extensionId LIMIT 1`,
    { extensionId: body.extensionId }
  );
  const ext = extRows[0];
  if (!ext) return ok(response, { message: "Extension not found" }, 404);
  if (ext.status !== "pending_payment") return ok(response, { message: "Extension not pending payment" }, 422);

  const payment = await createBkashPayment({ orderId: ext.order_id, amount: ext.additional_rent ?? ext.additionalRent ?? 0, payerReference: String(request.user?.userId) });
  await pool.execute("INSERT INTO payments (order_id, gateway, amount, status, gateway_payload) VALUES (:orderId, 'bkash', :amount, 'initiated', :payload)", {
    orderId: ext.order_id,
    amount: payment.amount,
    payload: JSON.stringify({ ...payment, extensionId: body.extensionId })
  });
  ok(response, { payment, extensionId: body.extensionId }, 201);
});

export const executeExtensionPayment = asyncHandler(async (request, response) => {
  const body = z.object({ paymentId: z.string().min(1), extensionId: z.coerce.number().int().positive() }).parse(request.body);
  const result = await executeBkashPayment(body.paymentId);

  const updateResult = await withTransaction(async (connection) => {
    // mark payment as paid for the order
    await connection.execute("UPDATE payments SET status = 'paid', transaction_id = :paymentId WHERE JSON_EXTRACT(gateway_payload, '$.extensionId') = CAST(:extensionId AS JSON) OR order_id = (SELECT order_id FROM rental_extensions WHERE id = :extensionId)", {
      paymentId: body.paymentId,
      extensionId: body.extensionId
    });

    const [extRows] = await connection.execute<any[]>("SELECT * FROM rental_extensions WHERE id = :extensionId FOR UPDATE", { extensionId: body.extensionId });
    const ext = extRows[0];
    if (!ext) throw new Error("Extension not found");
    if (ext.status !== "pending_payment") throw new Error("Extension not pending payment");

    // extend the rental end_date and mark extension approved
    await connection.execute("UPDATE rentals r JOIN rental_extensions re ON re.rental_id = r.id SET r.end_date = re.requested_end_date WHERE re.id = :extensionId", { extensionId: body.extensionId });
    await connection.execute("UPDATE rental_extensions SET status = 'approved' WHERE id = :extensionId", { extensionId: body.extensionId });

    // increase order total
    await connection.execute(
      "UPDATE orders o JOIN rental_extensions re ON re.rental_id = (SELECT rental_id FROM rental_extensions WHERE id = :extensionId) SET o.total_amount = o.total_amount + re.additional_rent WHERE re.id = :extensionId",
      { extensionId: body.extensionId }
    );

    return true;
  });

  await notifyUser(Number(request.user!.userId), "Extension paid", `Extension #${body.extensionId} payment completed and rental extended.`);
  ok(response, { result, extensionId: body.extensionId });
});
