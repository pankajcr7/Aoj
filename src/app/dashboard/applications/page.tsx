import { ArrowRight, CaretLeft, CaretRight, DownloadSimple, MagnifyingGlass, Tray } from "@phosphor-icons/react/ssr";
import { and, count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireRole, STAFF } from "@/lib/auth";
import { searchFilter } from "../queries";
import { EmptyState, fmtDate, PageHeader, StatusBadge } from "../ui";

const PAGE_SIZE = 25;
const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

export default async function ApplicationsPage({ searchParams }: PageProps<"/dashboard/applications">) {
  const user = await requireRole(STAFF);
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.status as Tab) ? (sp.status as Tab) : "pending";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(0, Number(sp.page) || 0);

  const where = and(tab === "all" ? undefined : eq(applications.status, tab), searchFilter(q));
  const [rows, byStatus] = await Promise.all([
    db
      .select({
        id: applications.id, name: applications.name, employeeId: applications.employeeId, company: applications.company,
        zone: applications.zone, circle: applications.circle, status: applications.status, createdAt: applications.createdAt,
        membershipNo: applications.membershipNo,
      })
      .from(applications)
      .where(where)
      .orderBy(tab === "pending" ? applications.createdAt : desc(applications.createdAt))
      .limit(PAGE_SIZE + 1)
      .offset(page * PAGE_SIZE),
    db.select({ status: applications.status, n: count() }).from(applications).groupBy(applications.status),
  ]);
  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number>;
  counts.all = byStatus.reduce((s, r) => s + r.n, 0);
  const hasNext = rows.length > PAGE_SIZE;
  const href = (p: Record<string, string | number>) =>
    "/dashboard/applications?" + new URLSearchParams({ status: tab, ...(q && { q }), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) });

  return (
    <>
      <PageHeader title="Applications" desc="Review membership applications and issue member logins.">
        {user.role === "admin" && (
          <a href={`/api/export?status=${tab}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="btn-outline">
            <DownloadSimple size={16} weight="bold" /> Export CSV
          </a>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex gap-1 overflow-x-auto rounded-lg bg-ink/[0.05] p-1">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/dashboard/applications?status=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {t}
              <span className="rounded-full bg-ink/[0.07] px-1.5 text-xs tabular-nums">{counts[t] ?? 0}</span>
            </Link>
          ))}
        </nav>
        <form className="relative md:w-80">
          <input type="hidden" name="status" value={tab} />
          <MagnifyingGlass size={18} className="pointer-events-none absolute top-3 left-3.5 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search name, employee ID, mobile…" className="field pl-10!" />
        </form>
      </div>

      <div className="card overflow-hidden">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Applicant</th>
                  <th className="px-5 py-3 font-medium">Organisation</th>
                  <th className="px-5 py-3 font-medium">Posting</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, PAGE_SIZE).map((a) => (
                  <tr key={a.id} className="group transition hover:bg-ink/[0.03]">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/applications/${a.id}`} className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-xs font-bold uppercase">
                          {a.name.slice(0, 2)}
                        </span>
                        <span>
                          <span className="block font-semibold">{a.name}</span>
                          <span className="block text-xs text-muted">{a.membershipNo ?? a.employeeId}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">{a.company}</td>
                    <td className="px-5 py-3.5">
                      <span className="block">{a.circle}</span>
                      <span className="block text-xs text-muted">{a.zone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{fmtDate(a.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/dashboard/applications/${a.id}`} className="inline-flex items-center gap-1 font-semibold text-accent">
                        {a.status === "pending" ? "Review" : "View"} <ArrowRight size={14} weight="bold" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Tray}
            title={q ? "No matches" : `No ${tab === "all" ? "" : tab} applications`}
            body={q ? "Try a different name, employee ID or mobile number." : "New applications from the membership form will appear here."}
          />
        )}
        {(page > 0 || hasNext) && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-muted">Page {page + 1}</span>
            <div className="flex gap-2">
              {page > 0 && (
                <Link href={href({ page: page - 1 })} className="btn-outline px-3 py-1.5">
                  <CaretLeft size={14} weight="bold" /> Previous
                </Link>
              )}
              {hasNext && (
                <Link href={href({ page: page + 1 })} className="btn-outline px-3 py-1.5">
                  Next <CaretRight size={14} weight="bold" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
