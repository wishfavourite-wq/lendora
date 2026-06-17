import { z } from "zod";
import { pool } from "../config/db.js";
import { asyncHandler, ok, ApiError } from "../utils/http.js";
import { fromUploadedFile } from "../services/storage.service.js";

const productSchema = z.object({
  name: z.string().min(3),
  categoryId: z.coerce.number().int().positive(),
  description: z.string().min(20),
  specifications: z.string().default("{}"),
  condition: z.enum(["new", "like_new", "good", "fair"]),
  productValue: z.coerce.number().positive(),
  dailyRent: z.coerce.number().positive(),
  weeklyRent: z.coerce.number().positive(),
  monthlyRent: z.coerce.number().positive(),
  securityDeposit: z.coerce.number().nonnegative(),
  maxRentalDuration: z.coerce.number().int().positive()
});

export const listProducts = asyncHandler(async (request, response) => {
  const { category, minRent, maxRent, condition, q } = request.query;
  const [rows] = await pool.execute<any[]>(
    `SELECT p.*, c.name AS category_name, s.store_name, u.name AS seller_name,
      COALESCE(AVG(rv.overall_experience), 0) AS seller_rating
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN sellers s ON s.id = p.seller_id
     JOIN users u ON u.id = s.user_id
     LEFT JOIN reviews rv ON rv.reviewed_user_id = u.id
     WHERE p.approval_status = 'approved'
       AND (:category IS NULL OR c.slug = :category)
       AND (:condition IS NULL OR p.condition_label = :condition)
       AND (:q IS NULL OR p.name LIKE CONCAT('%', :q, '%'))
       AND (:minRent IS NULL OR p.daily_rent >= :minRent)
       AND (:maxRent IS NULL OR p.daily_rent <= :maxRent)
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    { category: category ?? null, minRent: minRent ?? null, maxRent: maxRent ?? null, condition: condition ?? null, q: q ?? null }
  );
  ok(response, rows);
});

export const getProduct = asyncHandler(async (request, response) => {
  const [rows] = await pool.execute<any[]>(
    `SELECT p.*, c.name AS category_name, s.store_name, u.name AS seller_name, u.phone AS seller_phone
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN sellers s ON s.id = p.seller_id
     JOIN users u ON u.id = s.user_id
     WHERE p.id = :id`,
    { id: request.params.id }
  );
  if (!rows[0]) throw new ApiError(404, "Product not found");

  const [images] = await pool.execute("SELECT * FROM product_images WHERE product_id = :id", { id: request.params.id });
  const [videos] = await pool.execute("SELECT * FROM product_videos WHERE product_id = :id", { id: request.params.id });
  ok(response, { ...rows[0], images, videos });
});

export const createProduct = asyncHandler(async (request, response) => {
  const body = productSchema.parse(request.body);
  const [sellerRows] = await pool.execute<any[]>("SELECT id, approval_status FROM sellers WHERE user_id = :userId", {
    userId: request.user?.userId
  });
  const seller = sellerRows[0];
  if (!seller) throw new ApiError(403, "Seller profile is required");
  if (seller.approval_status !== "approved") throw new ApiError(403, "Seller must be approved before publishing products");

  const [result] = await pool.execute<any>(
    `INSERT INTO products
      (seller_id, category_id, name, description, specifications, condition_label, product_value, daily_rent, weekly_rent, monthly_rent, security_deposit, max_rental_duration)
     VALUES
      (:sellerId, :categoryId, :name, :description, :specifications, :conditionLabel, :productValue, :dailyRent, :weeklyRent, :monthlyRent, :securityDeposit, :maxRentalDuration)`,
    { ...body, sellerId: seller.id, conditionLabel: body.condition }
  );

  const files = (request.files as Express.Multer.File[] | undefined) ?? [];
  await Promise.all(
    files.map((file, index) => {
      const asset = fromUploadedFile(file);
      return pool.execute(
        "INSERT INTO product_images (product_id, image_url, is_cover, sort_order) VALUES (:productId, :imageUrl, :isCover, :sortOrder)",
        { productId: result.insertId, imageUrl: asset.url, isCover: index === 0, sortOrder: index }
      );
    })
  );

  ok(response, { id: result.insertId, approvalStatus: "pending" }, 201);
});

export const updateProduct = asyncHandler(async (request, response) => {
  const body = productSchema.partial().parse(request.body);
  await pool.execute(
    `UPDATE products SET
      name = COALESCE(:name, name),
      description = COALESCE(:description, description),
      daily_rent = COALESCE(:dailyRent, daily_rent),
      weekly_rent = COALESCE(:weeklyRent, weekly_rent),
      monthly_rent = COALESCE(:monthlyRent, monthly_rent),
      security_deposit = COALESCE(:securityDeposit, security_deposit),
      approval_status = 'pending'
     WHERE id = :id`,
    { ...body, id: request.params.id }
  );
  ok(response, { message: "Product updated and sent for approval" });
});

export const deleteProduct = asyncHandler(async (request, response) => {
  await pool.execute("UPDATE products SET status = 'archived' WHERE id = :id", { id: request.params.id });
  ok(response, { message: "Product archived" });
});
