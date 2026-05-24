import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./server/routes/auth.js";
import productsRouter from "./server/routes/products.js";
import ordersRouter from "./server/routes/orders.js";
import ticketsRouter from "./server/routes/tickets.js";
import checkoutRouter from "./server/routes/checkout.js";
import notificationsRouter from "./server/routes/notifications.js";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API ROUTES (The "Logic Layer")
  // ==========================================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Rustic Bakery API is running." });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/tickets", ticketsRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/notifications", notificationsRouter);

  // Background task to clean up expired reservations
  setInterval(async () => {
    try {
      const expiredReservations = await db.reservation.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { lt: new Date() }
        }
      });
      if (expiredReservations.length > 0) {
        await db.$transaction(async (tx) => {
          for (const res of expiredReservations) {
            await tx.reservation.update({
              where: { id: res.id },
              data: { status: "EXPIRED" }
            });
            await tx.product.update({
              where: { id: res.productId },
              data: { stockLevel: { increment: res.quantity } }
            });
          }
        });
        console.log(`Released ${expiredReservations.length} expired reservations`);
      }
    } catch (err) {
      console.error("Error releasing expired reservations:", err);
    }
  }, 60 * 1000); // Check every minute

  // ==========================================
  // VITE UI MIDDLEWARE (The "Presentation Layer")
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n\u2728 Server running at http://localhost:${PORT}`);
    console.log(`\u2699\ufe0f  Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
