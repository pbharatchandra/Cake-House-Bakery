import { Router } from "express";
import { getTickets, createTicket, updateTicket } from "../controllers/tickets.js";

const ticketsRouter = Router();

ticketsRouter.get("/", getTickets as any);
ticketsRouter.post("/", createTicket as any);
ticketsRouter.patch("/:id", updateTicket as any);

export default ticketsRouter;
