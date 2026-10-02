import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hireai-super-secret-jwt-key-change-in-production"
);
const COOKIE_NAME = "hireai_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  name: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── Sign JWT ────────────────────────────────────────────────────────────────

export async function signToken(payload: Omit<JwtPayload, "iat" | "exp">) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// ─── Verify JWT ──────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Set auth cookie ─────────────────────────────────────────────────────────

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

// ─── Clear auth cookie ───────────────────────────────────────────────────────

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Get current session ─────────────────────────────────────────────────────

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Require session (throws if not authenticated) ───────────────────────────

export async function requireSession(): Promise<JwtPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

// ─── Require specific role ───────────────────────────────────────────────────

export async function requireRole(role: Role): Promise<JwtPayload> {
  const session = await requireSession();
  if (session.role !== role) throw new Error("FORBIDDEN");
  return session;
}
