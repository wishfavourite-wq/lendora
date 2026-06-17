import { Router } from "express";
import { createPayment, executePayment } from "../controllers/payment.controller.js";
import { createExtensionPayment, executeExtensionPayment } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const paymentRouter = Router();

paymentRouter.use(requireAuth);
paymentRouter.post("/bkash/create", createPayment);
paymentRouter.post("/bkash/execute", executePayment);
paymentRouter.post("/bkash/extension/create", createExtensionPayment);
paymentRouter.post("/bkash/extension/execute", executeExtensionPayment);
