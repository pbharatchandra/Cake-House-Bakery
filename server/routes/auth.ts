import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerUser, getUsers, loginUser, firebaseLogin, updateProfile, getProfile, updatePassword, adminResetUserPassword, deleteUser, logoutUser } from "../controllers/auth.js";
import { requireAuth, requireAdmin } from "../lib/authMiddleware.js";

const authRouter = Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register requests per `window` (here, per 15 minutes)
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false }
});

// /api/auth/...
authRouter.post("/register", authLimiter, registerUser as any);
authRouter.post("/login", authLimiter, loginUser as any);
authRouter.post("/firebase-login", authLimiter, firebaseLogin as any);
authRouter.post("/logout", requireAuth as any, logoutUser as any);

authRouter.get("/profile/:id", requireAuth as any, getProfile as any);
authRouter.put("/profile", requireAuth as any, updateProfile as any);
authRouter.put("/password", requireAuth as any, updatePassword as any);

// Admin only endpoints
authRouter.get("/users", requireAuth as any, requireAdmin as any, getUsers as any);
authRouter.put("/users/:id/reset-password", requireAuth as any, requireAdmin as any, adminResetUserPassword as any);
authRouter.delete("/users/:id", requireAuth as any, requireAdmin as any, deleteUser as any);

export default authRouter;
