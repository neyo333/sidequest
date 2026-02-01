import type { Express } from "express";
import { z } from "zod";
import { db } from "../db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  generateUserId,
  generateTag,
  hashPassword,
  verifyPassword,
  createToken,
  createSession,
  getUserById,
  emailExists,
  usernameTagExists,
  requireAuth,
} from "../auth";

// Validation schemas
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function registerAuthRoutes(app: Express) {
  // Sign up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, username } = signupSchema.parse(req.body);

      // Check if email already exists
      if (await emailExists(email)) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Generate unique tag
      let tag = generateTag();
      let attempts = 0;
      while (await usernameTagExists(username, tag) && attempts < 10) {
        tag = generateTag();
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({ message: "Unable to generate unique username. Please try a different username." });
      }

      // Create user
      const userId = generateUserId();
      const passwordHash = await hashPassword(password);

      await db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        username,
        tag,
      });

      // Create session
      const sessionId = await createSession(userId);
      const token = createToken(userId);

      // Get user without password
      const user = await getUserById(userId);

      // Set cookie
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      });

      return res.status(201).json({
        user,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      const sessionId = await createSession(user.id);
      const token = createToken(user.id);

      // Get user without password
      const userWithoutPassword = await getUserById(user.id);

      // Set cookie
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      });

      return res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;

      if (sessionId) {
        // Delete session from database
        await db.delete(users).where(eq(users.id, sessionId));
      }

      // Clear cookie
      res.clearCookie("sessionId");

      return res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}