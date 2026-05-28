import { Request, Response } from "express";
import { db } from "../lib/db.js";

// GET /api/waste
export const getWasteLogs = async (req: Request, res: Response) => {
  try {
    const logs = await db.wasteLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching waste logs:", error);
    res.status(500).json({ error: "Failed to fetch waste logs" });
  }
};

// POST /api/waste
export const createWasteLog = async (req: Request, res: Response) => {
  try {
    const { note, value } = req.body;
    
    if (typeof value !== 'number' || value < 0) {
      return res.status(400).json({ error: "Invalid value" });
    }
    
    const log = await db.wasteLog.create({
      data: {
        note: note || "No note",
        value
      }
    });
    res.status(201).json(log);
  } catch (error) {
    console.error("Error creating waste log:", error);
    res.status(500).json({ error: "Failed to create waste log" });
  }
};
