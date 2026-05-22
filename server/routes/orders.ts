import { Router } from "express";
import { getOrders, createOrder, updateOrderStatus, addOrderItems } from "../controllers/orders.js";

const ordersRouter = Router();

ordersRouter.get("/", getOrders as any);
ordersRouter.post("/", createOrder as any);
ordersRouter.patch("/:id/status", updateOrderStatus as any);
ordersRouter.post("/:id/items", addOrderItems as any);

export default ordersRouter;
