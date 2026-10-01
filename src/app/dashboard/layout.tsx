import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireRole(["admin", "operations", "member"]);
  const pending =
    user.role === "member"
      ? 0
      : (await db.select({ n: count() }).from(applications).where(eq(applications.status, "pending")))[0].n;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <DashboardNav role={user.role} loginId={user.loginId} pending={pending} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
