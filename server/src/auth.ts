import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { query } from "./db.js";
import type { ClientUser } from "./serializers.js";
import { userRow } from "./serializers.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

export type AuthUser = ClientUser;

export interface JwtPayload {
  sub: string;
}

export function userToClient(
  row: Record<string, unknown>,
  apiBase: string
): ClientUser {
  return userRow(row, apiBase);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function loadUserById(
  id: string
): Promise<Record<string, unknown> | undefined> {
  const r = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return r.rows[0] as Record<string, unknown> | undefined;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export function createOptionalAuth(apiBase: string) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next();
    }
    const payload = verifyToken(header.slice(7));
    if (!payload) return next();
    const row = await loadUserById(payload.sub);
    if (row) req.user = userToClient(row, apiBase);
    next();
  };
}

export function createRequireAuth(apiBase: string) {
  const optional = createOptionalAuth(apiBase);
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    await optional(req, res, () => {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      next();
    });
  };
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}