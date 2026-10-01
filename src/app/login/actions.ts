"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";

export async function login(_: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const loginId = String(formData.get("loginId") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db.select().from(users).where(eq(users.loginId, loginId)).limit(1);
  // ponytail: no rate limiting yet, add per-IP throttling before public launch
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid login ID or password." };
  }
  if (!user.active) return { error: "This account is turned off. Please contact the admin." };

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
