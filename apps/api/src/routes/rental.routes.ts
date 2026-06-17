import { Router } from "express";
import {
  approveReturn,
  approveHandover,
  createRental,
  extendRental,
  listMyRentals,
  requestReturn
} from "../controllers/rental.controller.js";
import { requireAuth, allowRoles } from "../middleware/auth.middleware.js";

export const rentalRouter = Router();

rentalRouter.use(requireAuth);
rentalRouter.get("/", listMyRentals);
rentalRouter.post("/", allowRoles("customer"), createRental);
rentalRouter.post("/:id/extensions", allowRoles("customer"), extendRental);
rentalRouter.post("/:id/return-request", allowRoles("customer"), requestReturn);
rentalRouter.post("/:id/approve-return", allowRoles("seller", "admin"), approveReturn);
rentalRouter.post("/:id/approve-handover", allowRoles("seller"), approveHandover);
