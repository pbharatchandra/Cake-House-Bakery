import { Router } from "express";
import { registerUser, getUsers, loginUser, firebaseLogin, updateProfile, getProfile, updatePassword, adminResetUserPassword, deleteUser } from "../controllers/auth.js";

const authRouter = Router();

// /api/auth/register
authRouter.post("/register", registerUser as any);
authRouter.post("/login", loginUser as any);
authRouter.post("/firebase-login", firebaseLogin as any);
authRouter.get("/profile/:id", getProfile as any);
authRouter.put("/profile", updateProfile as any);
authRouter.put("/password", updatePassword as any);
authRouter.get("/users", getUsers as any);
authRouter.put("/users/:id/reset-password", adminResetUserPassword as any);
authRouter.delete("/users/:id", deleteUser as any);

export default authRouter;
