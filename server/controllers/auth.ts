import { Request, Response } from "express";
import { db } from "../lib/db.js"; // .js extension is required for ESM in Node

// MOCK: Generate JWT/sessions here in a real app
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, phoneNumber } = req.body;

    // Fallback basic setup
    const userRole = role || "CUSTOMER";

    const user = await db.user.create({
      data: {
        username,
        email,
        phoneNumber,
        password, // In a real app, hash this password!
        role: userRole,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      isNewUser: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let user = await db.user.findFirst({
      where: {
        OR: [{ email: email }, { phoneNumber: email }],
      },
    });

    // Auto-seed demo accounts
    if (!user) {
      if (email === "admin@rustic.com" && password === "dummy") {
        user = await db.user.create({
          data: { email, password, username: "Admin", role: "ADMIN" },
        });
      } else if (email === "kitchen@rustic.com" && password === "dummy") {
        user = await db.user.create({
          data: {
            email,
            password,
            username: "Kitchen Staff",
            role: "EMPLOYEE_OPS",
          },
        });
      }
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      isNewUser: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const firebaseLogin = async (req: Request, res: Response) => {
  try {
    const { uid, phoneNumber, password } = req.body;

    if (!uid || !phoneNumber) {
      return res.status(400).json({ error: "Missing uid or phone number" });
    }

    let user = await db.user.findFirst({
      where: { phoneNumber },
    });

    let isNewUser = false;
    if (!user) {
      user = await db.user.create({
        data: {
          id: uid,
          email: `${uid}@phone.com`, // mock email
          username: `User_${phoneNumber.substring(phoneNumber.length - 4)}`,
          password: password || `firebase_${uid}`,
          phoneNumber,
          role: "CUSTOMER",
        },
      });
      isNewUser = true;
    } else if (password) {
      user = await db.user.update({
        where: { id: user.id },
        data: { password },
      });
    }

    res.json({
      message: "Login successful",
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Firebase Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { username },
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          error: "Username is already taken. Please choose another one.",
        });
    }
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        phoneNumber: true,
        _count: {
          select: {
            orders: true,
            handledOrders: true,
          },
        },
      },
    });
    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminResetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    await db.user.update({
      where: { id },
      data: { password: newPassword },
    });

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userToDel = await db.user.findUnique({ where: { id } });
    if (userToDel?.role === "ADMIN") {
      return res.status(403).json({ error: "Cannot delete an Admin account." });
    }
    await db.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password !== oldPassword) {
      return res.status(401).json({ error: "Incorrect old password" });
    }

    await db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
