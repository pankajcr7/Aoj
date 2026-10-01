import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Session = { userId: string; role: "admin" | "operations" | "member" };

const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const WEEK = 60 * 60 * 24 * 7;

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key);
  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: WEEK,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<Session>(token, key, { algorithms: ["HS256"] });
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
