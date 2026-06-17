import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok } from "../utils/http.js";

const reviewSchema = z.object({
  rentalId: z.coerce.number().int().positive(),
  reviewedUserId: z.coerce.number().int().positive(),
  communication: z.coerce.number().min(1).max(5),
  productQuality: z.coerce.number().min(1).max(5),
  timelyReturn: z.coerce.number().min(1).max(5),
  overallExperience: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000).optional()
});

export const createReview = asyncHandler(async (request, response) => {
  const body = reviewSchema.parse(request.body);
  await pool.execute(
    `INSERT INTO reviews
      (rental_id, reviewer_user_id, reviewed_user_id, communication, product_quality, timely_return, overall_experience, comment)
     VALUES
      (:rentalId, :reviewerUserId, :reviewedUserId, :communication, :productQuality, :timelyReturn, :overallExperience, :comment)`,
    { ...body, reviewerUserId: request.user?.userId, comment: body.comment ?? null }
  );
  ok(response, { message: "Review submitted" }, 201);
});
