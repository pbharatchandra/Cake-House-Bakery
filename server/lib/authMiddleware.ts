import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_for_dev_only";

export interface AuthenticatedRequest extends Request {
  user?: any; // You can type this better with your User model
}

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    // Check if user still exists
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, username: true } // Don't select password
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized - User no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden - Insufficient permissions" });
    }
    
    next();
  };
};

export const requireAdmin = requireRole(["ADMIN"]);
export const requireEmployee = requireRole(["ADMIN", "EMPLOYEE_OPS", "EMPLOYEE_SUPPORT"]);
