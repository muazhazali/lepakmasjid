import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { newId } from "../id.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  userToClient,
  createRequireAuth,
  type AuthedRequest,
} from "../auth.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function authRouter(apiBase: string) {
  const router = Router();
  const requireAuth = createRequireAuth(apiBase);

  router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid input" });
      return;
    }
    const { email, password, passwordConfirm, name } = parsed.data;
    if (password !== passwordConfirm) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }
    const exists = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (exists.rows.length > 0) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }
    const id = newId();
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO users (id, email, password_hash, name, role, verified)
       VALUES ($1, $2, $3, $4, 'user', false)`,
      [id, email.toLowerCase(), hash, name ?? null]
    );
    const row = (await query(`SELECT * FROM users WHERE id = $1`, [id])).rows[0];
    const user = userToClient(row as Record<string, unknown>, apiBase);
    const token = signToken(id);
    res.json({ token, record: user });
  });

  router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid input" });
      return;
    }
    const { email, password } = parsed.data;
    const r = await query(`SELECT * FROM users WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    const row = r.rows[0] as Record<string, unknown> | undefined;
    if (!row?.password_hash) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }
    const ok = await verifyPassword(password, row.password_hash as string);
    if (!ok) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }
    const user = userToClient(row, apiBase);
    const token = signToken(user.id);
    res.json({ token, record: user });
  });

  router.get("/me", requireAuth, (req: AuthedRequest, res) => {
    res.json({ record: req.user });
  });

  router.post("/logout", (_req, res) => {
    res.json({ ok: true });
  });

  return router;
}