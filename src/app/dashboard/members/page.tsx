import { ArrowRight, CaretLeft, CaretRight, DownloadSimple, IdentificationCard, MagnifyingGlass, UsersThree } from "@phosphor-icons/react/ssr";
import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { applications, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { searchFilter } from "../queries";
import { EmptyState, fmtDate, PageHeader, StatusBadge } from "../ui";

const PAGE_SIZE = 25;

export default async function MembersPage({ searchParams }: PageProps<"/dashboard/members">) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(0, Number(sp.page) || 0);

  const rows = await db
    .select({
      id: applications.id, membershipNo: applications.membershipNo, name: applications.name, employeeId: applications.employeeId,
      company: applications.company, zone: applications.zone, circle: applications.circle, contact: applications.contact,
      approvedAt: applications.reviewedAt, loginId: users.loginId, status: applications.status,
    })
    .from(applications)
    .leftJoin(users, eq(users.applicationId, applications.id))
    .where(and(inArray(applications.status, ["approved", "suspended", "terminated"]), searchFilter(q)))
    .orderBy(desc(applications.reviewedAt))
    .limit(PAGE_SIZE + 1)
    .offset(page * PAGE_SIZE);
  const hasNext = rows.length > PAGE_SIZE;
  const href = (p: number) => `/dashboard/members?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Members" desc="All members of the association: active, suspended and terminated.">
        <a href={`/api/export?status=approved${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="btn-outline">
          <DownloadSimple size={16} weight="bold" /> Export CSV
        </a>
      </PageHeader>

      <form className="relative mb-4 md:w-96">
        <MagnifyingGlass size={18} className="pointer-events-none absolute top-3 left-3.5 text-muted" />
        <input name="q" defaultValue={q} placeholder="Search name, membership no., mobile…" className="field pl-10!" />
      </form>

      <div className="card overflow-hidden">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line text-left font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Membership No.</th>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Posting</th>
                  <th className="px-5 py-3 font-medium">Mobile</th>
                  <th className="px-5 py-3 font-medium">Member since</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, PAGE_SIZE).map((m) => (
                  <tr key={m.id} className="transition hover:bg-ink/[0.03]">
                    <td className="px-5 py-3.5 font-mono font-medium">{m.membershipNo}</td>
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold">{m.name}</span>
                      <span className="block text-xs text-muted">
                        {m.company} · {m.employeeId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block">{m.circle}</span>
                      <span className="block text-xs text-muted">{m.zone}</span>
                    </td>
                    <td className="px-5 py-3.5">{m.contact}</td>
                    <td className="px-5 py-3.5 text-muted">{fmtDate(m.approvedAt)}</td>
                    <td className="px-5 py-3.5">
                      {m.status === "approved" ? <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium tracking-[0.05em] text-accent uppercase">Active</span> : <StatusBadge status={m.status} />}
                      <span className="block font-mono text-xs text-muted">{m.loginId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <a href={`/api/card/${m.id}`} target="_blank" rel="noopener" className="mr-4 inline-flex items-center gap-1 font-semibold text-muted hover:text-ink">
                        <IdentificationCard size={15} weight="bold" /> Card
                      </a>
                      <Link href={`/dashboard/applications/${m.id}`} className="inline-flex items-center gap-1 font-medium text-ink hover:underline underline-offset-4">
                        Manage <ArrowRight size={14} weight="bold" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={UsersThree} title={q ? "No matches" : "No members yet"} body={q ? "Try a different search." : "Approved applications appear here as members."} />
        )}
        {(page > 0 || hasNext) && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-muted">Page {page + 1}</span>
            <div className="flex gap-2">
              {page > 0 && (
                <Link href={href(page - 1)} className="btn-outline px-3 py-1.5">
                  <CaretLeft size={14} weight="bold" /> Previous
                </Link>
              )}
              {hasNext && (
                <Link href={href(page + 1)} className="btn-outline px-3 py-1.5">
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
