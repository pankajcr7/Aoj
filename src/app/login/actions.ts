"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { applications, users } from "@/db/schema";
import { generatePassword } from "@/lib/credentials";
import { notify } from "@/lib/notify";
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

const SENT_MSG =
  "If the details match an active member, a new password has been sent to your registered email and mobile. Not received? Please contact the admin.";

/** Member self-service: login ID + registered mobile must match; the new password goes only to the contacts on file. */
export async function forgotPassword(_: { error?: string; ok?: string }, formData: FormData): Promise<{ error?: string; ok?: string }> {
  const loginId = String(formData.get("loginId") ?? "").trim().toLowerCase();
  const mobile = String(formData.get("mobile") ?? "").replace(/\D/g, "").slice(-10);
  if (!loginId || mobile.length !== 10) return { error: "Enter your login ID and 10-digit mobile number." };

  // ponytail: no rate limiting yet, same as login; add per-IP throttling before public launch
  const [m] = await db
    .select({ userId: users.id, oldHash: users.passwordHash, id: applications.id, name: applications.name, email: applications.email, contact: applications.contact })
    .from(users)
    .innerJoin(applications, eq(applications.id, users.applicationId))
    .where(and(eq(users.loginId, loginId), eq(users.active, true), eq(applications.contact, mobile)));
  // Same answer either way, so the form can't be used to discover which login IDs exist.
  if (!m) return { ok: SENT_MSG };

  const password = generatePassword();
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 12) }).where(eq(users.id, m.userId));
  const delivery = await notify("password", m, { loginId, password });
  // Nothing reached the member: keep the old password so they aren't locked out.
  if (delivery.email !== "sent" && delivery.sms !== "sent")
    await db.update(users).set({ passwordHash: m.oldHash }).where(eq(users.id, m.userId));
  return { ok: SENT_MSG };
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
