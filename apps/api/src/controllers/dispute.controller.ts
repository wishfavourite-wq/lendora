import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";
import { fromUploadedFile } from "../services/storage.service.js";

export const createDamageClaim = asyncHandler(async (request, response) => {
  const body = z.object({
    rentalId: z.coerce.number().int().positive(),
    description: z.string().min(10),
    estimatedDeduction: z.coerce.number().nonnegative()
  }).parse(request.body);
  const files = (request.files as Express.Multer.File[] | undefined) ?? [];
  const evidence = files.map(fromUploadedFile);
  await pool.execute(
    "INSERT INTO damage_claims (rental_id, seller_id, description, estimated_deduction, evidence_json, status) VALUES (:rentalId, :sellerId, :description, :estimatedDeduction, :evidenceJson, 'open')",
    { ...body, sellerId: request.user?.userId, evidenceJson: JSON.stringify(evidence) }
  );
  ok(response, { message: "Damage claim created" }, 201);
});

export const createDispute = asyncHandler(async (request, response) => {
  const body = z.object({
    rentalId: z.coerce.number().int().positive(),
    reason: z.enum(["damage", "missing_item", "late_return", "wrong_product_returned"]),
    description: z.string().min(10)
  }).parse(request.body);
  await pool.execute(
    "INSERT INTO disputes (rental_id, opened_by, reason, description, status) VALUES (:rentalId, :openedBy, :reason, :description, 'open')",
    { ...body, openedBy: request.user?.userId }
  );
  ok(response, { message: "Dispute created" }, 201);
});
