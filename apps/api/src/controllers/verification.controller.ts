import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";
import { fromUploadedFile } from "../services/storage.service.js";

export const submitSellerVerification = asyncHandler(async (request, response) => {
  const body = z.object({ address: z.string().min(5), nidNumber: z.string().min(6) }).parse(request.body);
  const files = (request.files as Express.Multer.File[] | undefined) ?? [];
  const assets = files.map(fromUploadedFile);
  await pool.execute(
    `INSERT INTO seller_verifications (seller_id, nid_number, address, profile_photo_url, nid_front_url, status)
     SELECT s.id, :nidNumber, :address, :profilePhoto, :nidFront, 'pending'
     FROM sellers s WHERE s.user_id = :userId`,
    {
      userId: request.user?.userId,
      nidNumber: body.nidNumber,
      address: body.address,
      profilePhoto: assets[0]?.url ?? null,
      nidFront: assets[1]?.url ?? null
    }
  );
  ok(response, { message: "Seller verification submitted" }, 201);
});

export const submitCustomerVerification = asyncHandler(async (request, response) => {
  const body = z.object({ nidNumber: z.string().optional() }).parse(request.body);
  await pool.execute(
    `INSERT INTO customer_verifications (customer_id, nid_number, status)
     SELECT c.id, :nidNumber, 'pending' FROM customers c WHERE c.user_id = :userId`,
    { userId: request.user?.userId, nidNumber: body.nidNumber ?? null }
  );
  ok(response, { message: "Customer verification submitted" }, 201);
});
