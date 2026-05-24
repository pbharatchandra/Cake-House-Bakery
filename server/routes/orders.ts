import { Router } from "express";
import { getOrders, createOrder, updateOrderStatus, addOrderItems, removeOrderItem, streamOrders } from "../controllers/orders.js";

const ordersRouter = Router();

ordersRouter.get("/stream", streamOrders as any);
ordersRouter.get("/", getOrders as any);
ordersRouter.post("/", createOrder as any);
ordersRouter.patch("/:id/status", updateOrderStatus as any);
ordersRouter.post("/:id/items", addOrderItems as any);
ordersRouter.delete("/:id/items/:itemId", removeOrderItem as any);

export default ordersRouter;
