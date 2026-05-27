import { Request, Response } from "express";
import { db } from "../lib/db.js";
import { webpush } from "../lib/webpush.js";
import { orderEvents } from "../lib/events.js";

export const streamOrders = (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const listener = () => {
    res.write(`data: trigger\n\n`);
  };

  orderEvents.on("update", listener);

  // Send a heartbeat every 30 seconds to prevent connection drops and pool exhaustion
  const heartbeat = setInterval(() => {
    res.write(`:\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    orderEvents.off("update", listener);
  });
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId: String(userId) } : {};
    
    const orders = await db.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true },
        },
        orderItems: {
          include: { product: { include: { category: true } } },
        },
        handledBy: {
          select: { id: true, username: true },
        },
      },
    });
    res.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      paymentMethod,
      transactionId,
      cancellationReason,
      discount,
      extraFee,
      extraFeeNote,
      handledById,
    } = req.body;

    // Status must be one of "PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"
    const validStatuses = [
      "PENDING",
      "PREPARING",
      "READY",
      "DELIVERED",
      "CANCELLED",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // If discount is provided, update totalAmount
    const updateData: any = {
      ...(status && { status }),
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId && { transactionId }),
      ...(cancellationReason && { cancellationReason }),
      ...(handledById && { handledById }),
    };

    if (discount !== undefined && discount !== null) {
      updateData.discount = parseFloat(discount);
    }
    if (extraFee !== undefined && extraFee !== null) {
      updateData.extraFee = parseFloat(extraFee);
    }
    if (extraFeeNote !== undefined) {
      updateData.extraFeeNote = extraFeeNote;
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true },
        },
        orderItems: {
          include: { product: { include: { category: true } } },
        },
        handledBy: {
          select: { id: true, username: true },
        },
      },
    });

    if ((status === 'READY' || status === 'CANCELLED') && order.userId) {
      try {
        const subscriptions = await db.pushSubscription.findMany({
          where: { userId: order.userId }
        });
        
        let message = '';
        if (status === 'READY') {
          message = `Your order #${order.id.slice(-6)} is ready for pickup!`;
        } else if (status === 'CANCELLED') {
          message = `Your order #${order.id.slice(-6)} was cancelled.`;
          if (cancellationReason) {
            message += ` Reason: ${cancellationReason}`;
          }
        }
        
        const payload = JSON.stringify({ title: 'Order Update', body: message });
        
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload);
          } catch (e: any) {
             if (e.statusCode === 410) {
               await db.pushSubscription.delete({ where: { id: sub.id } });
             }
          }
        }
      } catch (err) {
        console.error("Push notification error:", err);
      }
    }

    orderEvents.emit("update");
    res.json({ order });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: "Order not found" });
    }
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
          where: { id: item.productId },
        });

        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockLevel: Math.max(0, product.stockLevel - item.quantity),
            },
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
            })),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          },
          orderItems: {
            include: { 
              product: {
                include: { category: true }
              }
            },
          },
        },
      });
    });

    orderEvents.emit("update");
    res.json({ order: updatedOrder });
  } catch (error) {
    console.error("Add order items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeOrderItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;

    const updatedOrder = await db.$transaction(async (tx) => {
      // Get the order item
      const orderItem = await tx.orderItem.findUnique({
        where: { id: itemId },
        include: { order: true }
      });

      if (!orderItem) {
        throw new Error("Order item not found");
      }

      if (orderItem.orderId !== id) {
        throw new Error("Order item does not belong to this order");
      }

      // Restore stock
      if (orderItem.productId) {
        const product = await tx.product.findUnique({
          where: { id: orderItem.productId }
        });

        if (product) {
          await tx.product.update({
            where: { id: orderItem.productId },
            data: {
              stockLevel: product.stockLevel + orderItem.quantity
            }
          });
        }
      }

      // Calculate amount to deduct
      const amountToDeduct = orderItem.price * orderItem.quantity;
      const newTotalAmount = Math.max(0, orderItem.order.totalAmount - amountToDeduct);

      // Remove the item
      await tx.orderItem.delete({
        where: { id: itemId }
      });

      // Update the order, check if we should delete Order if no items remain? 
      // User says "remove the product from the order". If total goes under 0 is handled.
      // If we need order to still exist empty, we just update it.
      return await tx.order.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          },
          orderItems: {
            include: { 
              product: {
                include: { category: true }
              }
            },
          },
        },
      });
    });

    orderEvents.emit("update");
    res.json({ order: updatedOrder });
  } catch (error) {
    console.error("Remove order item error:", error);
    res.status(500).json({ error: (error as Error).message || "Internal server error" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      totalAmount,
      address,
      items,
      reservationIds,
      handledById,
      customerPhone,
      customerName,
    } = req.body;
    // items: [{ productId, quantity, price, customizations }]

    const storeStatusSetting = await db.setting.findUnique({ where: { key: 'store_status' } });
    const isClosed = storeStatusSetting?.value === 'CLOSED';

    if (isClosed) {
      let isHandlerAdmin = false;
      const checkerId = handledById || userId;
      if (checkerId) {
        const checkerUser = await db.user.findUnique({ where: { id: checkerId } });
        if (checkerUser?.role === 'ADMIN') {
          isHandlerAdmin = true;
        }
      }
      
      if (!isHandlerAdmin) {
        return res.status(403).json({ error: "store is closed currently" });
      }
    }

    let resolvedUserId = userId;

    if (customerPhone) {
      // Find user by phone number
      let phoneUser = await db.user.findFirst({
        where: { phoneNumber: customerPhone },
      });
      if (phoneUser) {
        resolvedUserId = phoneUser.id;
      } else {
        // Create a placeholder user for this phone number
        phoneUser = await db.user.create({
          data: {
            username: customerName || `guest_${customerPhone}`,
            email: `guest_${customerPhone}@offline.com`,
            password: "dummy",
            phoneNumber: customerPhone,
          },
        });
        resolvedUserId = phoneUser.id;
      }
    } else if (!resolvedUserId) {
      resolvedUserId = "offline_customer";
    }

    // Ensure the user exists, create a placeholder if it doesn't
    let user = await db.user.findUnique({ where: { id: resolvedUserId } });
    if (!user) {
      user = await db.user.create({
        data: {
          id: resolvedUserId,
          username: `user_${resolvedUserId}`,
          email: `user_${resolvedUserId}@test.com`,
          password: "dummy",
        },
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
          return res
            .status(400)
            .json({
              error: `Invalid customizations format for product ${item.productId}`,
            });
        }

        const product = await db.product.findUnique({
          where: { id: item.productId },
        });
        if (product && product.customizationOptions) {
          const options = JSON.parse(product.customizationOptions);
          for (const opt of options) {
            if (
              opt.required &&
              (!parsedCustomizations[opt.name] ||
                parsedCustomizations[opt.name].trim() === "")
            ) {
              return res
                .status(400)
                .json({
                  error: `Missing required customization: ${opt.name} for product ${product.name}`,
                });
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
          userId: resolvedUserId,
          totalAmount,
          address,
          handledById: handledById || undefined,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              customizations: item.customizations,
            })),
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Mark reservations as CONSUMED if provided
      if (reservationIds && Array.isArray(reservationIds)) {
        for (const resId of reservationIds) {
          await tx.reservation.update({
            where: { id: resId },
            data: { status: "CONSUMED" },
          });
        }
      } else {
        // If no reservations were made, deduct stock here
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockLevel: Math.max(0, product.stockLevel - item.quantity),
              },
            });
          }
        }
      }

      return newOrder;
    });

    orderEvents.emit("update");
    res.status(201).json({ order });
  } catch (error) {
    console.error("Create order error:", error instanceof Error ? error.message : error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as any).code;
      console.error("Prisma error code:", code);
      console.error("Prisma error meta:", (error as any).meta);
      
      if (code === 'P2003') {
        const target = (error as any).meta?.field_name || (error as any).meta?.target;
        return res.status(400).json({ error: `Invalid reference provided. One of the related records (User, Product, etc.) does not exist. Details: ${target}` });
      }
      if (code === 'P2025') {
        return res.status(400).json({ error: "One or more records to update not found (e.g. invalid reservation)." });
      }
    }
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
};
