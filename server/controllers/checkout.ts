import { Request, Response } from "express";
import { db } from "../lib/db.js";

export const reserveCart = async (req: Request, res: Response) => {
  try {
    const { items, userId } = req.body;
    // items: [{ productId, quantity }]

    const storeStatusSetting = await db.setting.findUnique({ where: { key: 'store_status' } });
    const isClosed = storeStatusSetting?.value === 'CLOSED';

    if (isClosed) {
      let isHandlerAdmin = false;
      if (userId) {
        const checkerUser = await db.user.findUnique({ where: { id: userId } });
        if (checkerUser?.role === 'ADMIN') {
          isHandlerAdmin = true;
        }
      }
      
      if (!isHandlerAdmin) {
        return res.status(403).json({ error: "store is closed currently" });
      }
    }

    const reservationIds: string[] = [];

    // Start transaction to reserve items
    const reservations = await db.$transaction(async (tx) => {
      const createdReservations = [];
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product || product.stockLevel < item.quantity) {
          throw new Error(`Not enough stock for ${product?.name}`);
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        const reservation = await tx.reservation.create({
          data: {
            productId: item.productId,
            userId: userId || null,
            quantity: item.quantity,
            expiresAt,
            status: "ACTIVE"
          }
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stockLevel: product.stockLevel - item.quantity }
        });

        createdReservations.push(reservation);
      }
      return createdReservations;
    });

    res.status(200).json({ reservations });
  } catch (error: any) {
    console.error("Reserve cart error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const releaseReservation = async (req: Request, res: Response) => {
  try {
    const { reservationIds } = req.body;
    
    await db.$transaction(async (tx) => {
      for (const id of reservationIds) {
        const reservation = await tx.reservation.findUnique({
          where: { id }
        });

        if (reservation && reservation.status === "ACTIVE") {
          await tx.reservation.update({
            where: { id },
            data: { status: "EXPIRED" }
          });

          await tx.product.update({
            where: { id: reservation.productId },
            data: { stockLevel: { increment: reservation.quantity } }
          });
        }
      }
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Release reservation error:", error);
    res.status(500).json({ error: "Failed to release reservations" });
  }
};
