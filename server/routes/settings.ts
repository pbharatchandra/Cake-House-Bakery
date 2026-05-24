import express from "express";
import { db } from "../lib/db.js";

const router = express.Router();

// Get settings
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await db.setting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      // Return default values
      if (key === 'store_status') {
        return res.json({ value: 'OPEN' });
      }
      return res.status(404).json({ error: "Setting not found" });
    }
    
    res.json({ value: setting.value });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update settings (Admin only)
router.post("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    res.json({ setting });
  } catch (error) {
    console.error("Update setting error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
