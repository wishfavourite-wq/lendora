import { Router } from "express";
import { analytics, approveProduct, approveSeller, platformSettings, resolveDispute } from "../controllers/admin.controller.js";
import { approveRefund, listRefunds } from "../controllers/refund.controller.js";
import { listTickets, updateTicket } from "../controllers/support.controller.js";
import { requireAuth, allowRoles } from "../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, allowRoles("admin"));
adminRouter.get("/analytics", analytics);
adminRouter.get("/settings", platformSettings);
adminRouter.post("/sellers/:id/approve", approveSeller);
adminRouter.post("/products/:id/approve", approveProduct);
adminRouter.post("/disputes/:id/resolve", resolveDispute);
adminRouter.get("/refunds", listRefunds);
adminRouter.post("/refunds/:id/approve", approveRefund);
adminRouter.get("/support-tickets", listTickets);
adminRouter.patch("/support-tickets/:id", updateTicket);
