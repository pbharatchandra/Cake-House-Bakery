import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

import { execSync } from "child_process";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRouter from "./server/routes/auth.js";
import productsRouter from "./server/routes/products.js";
import ordersRouter from "./server/routes/orders.js";
import ticketsRouter from "./server/routes/tickets.js";
import checkoutRouter from "./server/routes/checkout.js";
import notificationsRouter from "./server/routes/notifications.js";
import configRouter from "./server/routes/config.js";
import backupRouter from "./server/routes/backup.js";
import { db } from "./server/lib/db.js";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  // 1. HTTP Security Headers
  // We disable contentSecurityPolicy in dev so Vite HMR / inline scripts work smoothly
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // 2. Body Parser & Cookie Parser
  app.use(express.json());
  app.use(cookieParser());

  // 3. Rate Limiting (Basic DoS / DDoS protection)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Limit each IP to 2000 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });

  // Apply the rate limiting middleware to API calls only
  app.use("/api", apiLimiter);

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
  app.use("/api/config", configRouter);
  app.use("/api/backup", backupRouter);

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
