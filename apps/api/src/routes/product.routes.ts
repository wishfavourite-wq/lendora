import { Router } from "express";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "../controllers/product.controller.js";
import { requireAuth, allowRoles } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

export const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:id", getProduct);
productRouter.post("/", requireAuth, allowRoles("seller"), upload.array("images", 12), createProduct);
productRouter.put("/:id", requireAuth, allowRoles("seller"), updateProduct);
productRouter.delete("/:id", requireAuth, allowRoles("seller", "admin"), deleteProduct);
