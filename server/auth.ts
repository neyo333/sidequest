import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, randomInt } from "crypto";
import { db } from "./db";
import { users, sessions } from "@db/schema";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Generate unique user ID
export function generateUserId(): string {
  return randomBytes(16).toString("hex");
}

// Generate 4-digit tag
export function generateTag(): string {
  return randomInt(1000, 9999).toString();
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create JWT token
export function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Create session
export async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

// Get user from session
export async function getUserFromSession(sessionId: string): Promise<string | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.userId;
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// Middleware: Require authentication
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    // Also check cookie for session ID (for browser compatibility)
    const sessionId = req.cookies?.sessionId;

    let userId: string | null = null;

    // Try JWT first
    if (token) {
      const decoded = verifyToken(token);
      userId = decoded?.userId || null;
    }

    // Fallback to session
    if (!userId && sessionId) {
      userId = await getUserFromSession(sessionId);
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user ID to request
    (req as any).userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Get user by ID (without password)
export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      tag: users.tag,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  return user || null;
}

// Check if email exists
export async function emailExists(email: string): Promise<boolean> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  return !!user;
}

// Check if username+tag combo exists
export async function usernameTagExists(username: string, tag: string): Promise<boolean> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));

  if (!user) return false;

  const [tagMatch] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.tag, tag));

  return !!tagMatch;
}