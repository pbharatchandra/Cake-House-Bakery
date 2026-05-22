import { Request, Response } from "express";
import { db } from "../lib/db.js";

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await db.order.findMany({
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true }
        },
        orderItems: {
          include: { product: true }
        },
        handledBy: {
          select: { id: true, username: true }
        }
      },
    });
    res.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, transactionId, cancellationReason, discount, handledById } = req.body;
    
    // Status must be one of "PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"
    const validStatuses = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // If discount is provided, update totalAmount
    const updateData: any = {
      ...(status && { status }),
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId && { transactionId }),
      ...(cancellationReason && { cancellationReason }),
      ...(handledById && { handledById })
    };

    if (discount !== undefined && discount !== null) {
      updateData.discount = parseFloat(discount);
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true }
        },
        orderItems: {
          include: { product: true }
        },
        handledBy: {
          select: { id: true, username: true }
        }
      }
    });

    res.json({ order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addOrderItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      // Get the current order
      const order = await tx.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      let totalAdditionalAmount = 0;

      for (const item of items) {
        totalAdditionalAmount += item.price * item.quantity;

        // Deduct stock
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockLevel: Math.max(0, product.stockLevel - item.quantity) }
          });
        }
      }

      // Add items and update totalAmount
      return await tx.order.update({
        where: { id },
        data: {
          totalAmount: order.totalAmount + totalAdditionalAmount,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              customizations: item.customizations,
            }))
          }
        },
        include: {
          user: {
            select: { id: true, username: true, email: true, phoneNumber: true }
          },
          orderItems: {
            include: { product: true }
          }
        }
      });
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error("Add order items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, totalAmount, address, items, reservationIds, handledById } = req.body;
    // items: [{ productId, quantity, price, customizations }]
    
    // Ensure the user exists, create a placeholder if it doesn't
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: {
          id: userId,
          username: `user_${userId}`,
          email: `user_${userId}@test.com`,
          password: "dummy",
        }
      });
    }

    // In a real app, calculate totalAmount on the backend based on db prices to prevent tampering
    
    // Validate customizations for each item
    for (const item of items) {
      if (item.customizations) {
        let parsedCustomizations;
        try {
          parsedCustomizations = JSON.parse(item.customizations);
        } catch (e) {
          return res.status(400).json({ error: `Invalid customizations format for product ${item.productId}` });
        }
        
        const product = await db.product.findUnique({ where: { id: item.productId } });
        if (product && product.customizationOptions) {
           const options = JSON.parse(product.customizationOptions);
           for (const opt of options) {
             if (opt.required && (!parsedCustomizations[opt.name] || parsedCustomizations[opt.name].trim() === '')) {
               return res.status(400).json({ error: `Missing required customization: ${opt.name} for product ${product.name}` });
             }
           }
        }
      }
    }

    // Start a Prisma transaction to ensure atomicity
    const order = await db.$transaction(async (tx) => {
      // Create the order with its items
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          address,
          handledById,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              customizations: item.customizations,
            }))
          }
        },
        include: {
          orderItems: true
        }
      });

      // Mark reservations as CONSUMED if provided
      if (reservationIds && Array.isArray(reservationIds)) {
        for (const resId of reservationIds) {
          await tx.reservation.update({
            where: { id: resId },
            data: { status: "CONSUMED" }
          });
        }
      } else {
        // If no reservations were made, deduct stock here
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockLevel: Math.max(0, product.stockLevel - item.quantity) }
            });
          }
        }
      }

      return newOrder;
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
