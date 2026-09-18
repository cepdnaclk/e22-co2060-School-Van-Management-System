import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import { signAuthToken, authenticateDemoUser, getDemoCredentials } from "../services/authService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { demoUsers } from "../data/demoUsers";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }

    if (!["admin", "driver", "parent"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email already exists
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, phone, is_approved`,
      [name, email, password_hash, role, phone || null, role === "admin" ? true : false] // Auto approve admin for now, or maybe require approval for drivers
    );

    const newUser = result.rows[0];

    const token = signAuthToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: newUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Server error during registration", details: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if it's a demo user first
    const demoUser = authenticateDemoUser(email, password);
    if (demoUser) {
      const token = signAuthToken({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
      });

      return res.json({
        token,
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
        },
      });
    }

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Optional: check if approved
    // if (!user.is_approved) {
    //   return res.status(403).json({ error: "Account pending approval" });
    // }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Server error during login" });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, phone, is_approved, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    let user = result.rows[0];

    if (!user) {
      const demo = demoUsers.find((u) => u.id === req.user?.id);
      if (demo) {
        user = {
          id: demo.id,
          name: demo.name,
          email: demo.email,
          role: demo.role,
          phone: "",
          is_approved: true,
          created_at: new Date(),
        };
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (demoUsers.some((u) => u.id === user.id)) {
      const responseBody: any = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      };

      if (user.role === "driver") {
        const driverRes = await pool.query("SELECT id FROM drivers WHERE user_id = $1", [user.id]);
        if (driverRes.rows.length > 0) {
          const dId = driverRes.rows[0].id;
          responseBody.driverId = dId;
          const journeyRes = await pool.query(
            "SELECT id FROM journeys WHERE driver_id = $1 AND completed_at IS NULL LIMIT 1",
            [dId]
          );
          if (journeyRes.rows.length > 0) {
            responseBody.activeJourneyId = journeyRes.rows[0].id;
          }
        }
      }

      return res.json(responseBody);
    }

    const responseBody: any = { user };
    if (user.role === "driver") {
      const driverRes = await pool.query("SELECT id FROM drivers WHERE user_id = $1", [user.id]);
      if (driverRes.rows.length > 0) {
        const dId = driverRes.rows[0].id;
        responseBody.driverId = dId;
        const journeyRes = await pool.query(
          "SELECT id FROM journeys WHERE driver_id = $1 AND completed_at IS NULL LIMIT 1",
          [dId]
        );
        if (journeyRes.rows.length > 0) {
          responseBody.activeJourneyId = journeyRes.rows[0].id;
        }
      }
    }

    res.json(responseBody);
  } catch (error: any) {
    res.status(500).json({ error: "Server error profile fetch" });
  }
};

// Keep for legacy frontend tests if they still exist, otherwise just return empty
export const listDemoAccounts = async (_req: Request, res: Response) => {
  return res.json({
    accounts: getDemoCredentials(),
  });
};

export const deleteCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);
    res.json({ success: true, message: "User account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete user profile" });
  }
};
