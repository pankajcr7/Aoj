import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { AccountControls, CreateStaffForm } from "../forms";
import { fmtDate, PageHeader } from "../ui";

export default async function StaffPage() {
  const me = await requireRole(["admin"]);
  const staff = await db
    .select({ id: users.id, loginId: users.loginId, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .where(inArray(users.role, ["admin", "operations"]))
    .orderBy(desc(users.createdAt));

  return (
    <>
      <PageHeader title="Staff" desc="Admin and Operation Team accounts." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="card divide-y divide-line">
          {staff.map((s) => (
            <div key={s.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-sm font-bold uppercase">{s.loginId.slice(0, 2)}</span>
                <div>
                  <p className="font-semibold">
                    {s.loginId} {s.id === me.id && <span className="text-xs font-normal text-muted">(you)</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {s.role === "admin" ? "Admin" : "Operation Team"} · added {fmtDate(s.createdAt)} ·{" "}
                    <span className={s.active ? "text-accent" : "text-danger"}>{s.active ? "Active" : "Turned off"}</span>
                  </p>
                </div>
              </div>
              <div className="sm:max-w-xs">
                <AccountControls userId={s.id} active={s.active} isSelf={s.id === me.id} />
              </div>
            </div>
          ))}
        </div>
        <div className="card p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 font-semibold">Add staff account</h2>
          <CreateStaffForm />
        </div>
      </div>
    </>
  );
}
