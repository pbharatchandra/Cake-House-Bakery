import { Request, Response } from "express";
import { db } from "../lib/db.js";

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await db.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { order: true, user: true }
    });
    res.json({ tickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { userId, guestEmail, orderId, subject, message } = req.body;
    const ticket = await db.supportTicket.create({
      data: { userId, guestEmail, orderId, subject, message },
    });
    res.json({ ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await db.supportTicket.update({
      where: { id },
      data: { status }
    });
    res.json({ ticket });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
