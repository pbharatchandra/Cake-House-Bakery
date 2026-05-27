import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { db } from "../lib/db.js";

import { execSync } from "child_process";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `uploaded_backup_${timestamp}.db`);
  }
});

const upload = multer({ storage: storage });

// Download the current database file
router.get("/download", (req, res) => {
  try {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "Database file not found" });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cake_house_backup_${timestamp}.db`;

    res.download(dbPath, filename, (err) => {
      if (err) {
        console.error("Error downloading backup:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to download backup" });
        }
      }
    });

  } catch (error) {
    console.error("Backup trigger error:", error);
    res.status(500).json({ error: "Internal server error during backup" });
  }
});

// Create a local backup on the server
router.post("/create", (req, res) => {
  try {
    const { userId } = req.body;
    // Basic check for admin role could be handled here or front-end

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "Database file not found" });
    }

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const existingBackups = fs.readdirSync(backupDir).filter(f => f.endsWith('.db'));
    if (existingBackups.length >= 30) {
      return res.status(400).json({ error: "local server archives limit reached and the limit 30 reached" });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFilename);

    fs.copyFileSync(dbPath, backupPath);

    res.json({ message: "Backup created successfully", filename: backupFilename });
  } catch (error) {
    console.error("Backup creation error:", error);
    res.status(500).json({ error: "Failed to create local backup" });
  }
});

// List all local backups
router.get("/list", (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db'))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // newest first;

    res.json({ backups: files });
  } catch (error) {
    console.error("List backups error:", error);
    res.status(500).json({ error: "Failed to list backups" });
  }
});

// Restore from a local backup
router.post("/restore", async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "Filename required" });

    const backupDir = path.join(process.cwd(), "backups");
    const backupPath = path.join(backupDir, filename);
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    // Disconnect Prisma to release file locks and clean up DB connections
    await db.$disconnect();

    // Overwrite the current database with the backup
    fs.copyFileSync(backupPath, dbPath);
    
    // Clean up SQLite WAL/SHM files if they exist to prevent corruption or old data persisting
    const walPath = dbPath + "-wal";
    const shmPath = dbPath + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // MIGRATION: Ensure correct tables/columns exist in the newly restored database
    try {
      execSync("npx prisma db push --accept-data-loss", { stdio: 'inherit' });
    } catch (e) {
      console.error("Failed to sync database schema:", e);
    }

    res.json({ message: "Database restored successfully." });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({ error: "Failed to restore backup" });
  }
});

// Upload and restore from an external file
router.post("/upload", upload.single('database'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const backupPath = req.file.path;
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");

    // Disconnect Prisma to release file locks and clean up DB connections
    await db.$disconnect();

    // Overwrite the current database with the newly uploaded backup
    fs.copyFileSync(backupPath, dbPath);
    
    // Clean up SQLite WAL/SHM files
    const walPath = dbPath + "-wal";
    const shmPath = dbPath + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // MIGRATION: Ensure correct tables/columns exist in the newly restored database
    try {
      execSync("npx prisma db push --accept-data-loss", { stdio: 'inherit' });
    } catch (e) {
      console.error("Failed to sync database schema:", e);
    }

    res.json({ message: "Database imported and restored successfully." });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload and restore backup" });
  }
});

router.post("/delete", (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    const { filename } = req.body;
    
    // Prevent path traversal
    if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
       return res.status(400).json({ error: "Invalid backup filename" });
    }

    const backupPath = path.join(backupDir, filename);

    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      res.json({ message: "Backup deleted successfully" });
    } else {
      res.status(404).json({ error: "Backup not found" });
    }
  } catch (error) {
    console.error("Delete backup error:", error);
    res.status(500).json({ error: "Failed to delete backup" });
  }
});

export default router;
