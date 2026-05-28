import { Router } from "express";
import { getWasteLogs, createWasteLog } from "../controllers/waste.js";
import { requireAuth, requireAdmin } from "../lib/authMiddleware.js";

const router = Router();

router.get("/", requireAuth as any, requireAdmin as any, getWasteLogs as any);
router.post("/", requireAuth as any, requireAdmin as any, createWasteLog as any);

export default router;
