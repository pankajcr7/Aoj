import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, type Session } from "./session";

export type Role = Session["role"];
export const STAFF: Role[] = ["admin", "operations"];

// Looks the user up on every request, so deactivating an account takes effect immediately.
export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db
    .select({ id: users.id, loginId: users.loginId, role: users.role, active: users.active, applicationId: users.applicationId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return user?.active ? user : null;
});

/** Use in every protected page and server action. */
export async function requireRole(roles: Role[]) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
