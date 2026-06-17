import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { productRouter } from "./product.routes.js";
import { rentalRouter } from "./rental.routes.js";
import { requireAuth, allowRoles } from "../middleware/auth.middleware.js";
import { createReview } from "../controllers/review.controller.js";
import { listMessages, sendMessage } from "../controllers/chat.controller.js";
import { createTicket } from "../controllers/support.controller.js";
import { submitCustomerVerification, submitSellerVerification } from "../controllers/verification.controller.js";
import { createDamageClaim, createDispute } from "../controllers/dispute.controller.js";
import { upload } from "../middleware/upload.middleware.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => response.json({ success: true, app: "Lendora API" }));
apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/rentals", rentalRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin", adminRouter);

apiRouter.post("/reviews", requireAuth, createReview);
apiRouter.get("/chat/:orderId", requireAuth, listMessages);
apiRouter.post("/chat", requireAuth, sendMessage);
apiRouter.post("/support-tickets", requireAuth, createTicket);
apiRouter.post("/seller-verification", requireAuth, allowRoles("seller"), upload.array("documents", 3), submitSellerVerification);
apiRouter.post("/customer-verification", requireAuth, allowRoles("customer"), submitCustomerVerification);
apiRouter.post("/damage-claims", requireAuth, allowRoles("seller"), upload.array("evidence", 12), createDamageClaim);
apiRouter.post("/disputes", requireAuth, createDispute);
