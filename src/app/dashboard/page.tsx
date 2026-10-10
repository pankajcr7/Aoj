import { ArrowRight, CheckCircle, ClipboardText, Clock, IdentificationCard, Tray, UsersThree, XCircle } from "@phosphor-icons/react/ssr";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { RazorpayPayment } from "@/components/razorpay-payment";
import { RAZORPAY_ENABLED, PVC_CARD_PAISE } from "@/lib/payment-rules";
import { applications, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { Detail, EmptyState, fmtDate, PageHeader, StatCard, StatusBadge } from "./ui";

export default async function Overview() {
  const user = await requireRole(["admin", "operations", "member"]);
  return user.role === "member" ? <MemberHome applicationId={user.applicationId} /> : <StaffHome isAdmin={user.role === "admin"} />;
}

async function StaffHome({ isAdmin }: { isAdmin: boolean }) {
  const [byStatus, [week], queue, zones] = await Promise.all([
    db.select({ status: applications.status, n: count() }).from(applications).groupBy(applications.status),
    db.select({ n: count() }).from(applications).where(gte(applications.createdAt, sql`now() - interval '7 days'`)),
    db
      .select({ id: applications.id, name: applications.name, employeeId: applications.employeeId, circle: applications.circle, company: applications.company, createdAt: applications.createdAt })
      .from(applications)
      .where(eq(applications.status, "pending"))
      .orderBy(applications.createdAt)
      .limit(6),
    db
      .select({ zone: applications.zone, n: count() })
      .from(applications)
      .where(eq(applications.status, "approved"))
      .groupBy(applications.zone)
      .orderBy(desc(count()))
      .limit(6),
  ]);
  const c = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number | undefined>;
  const maxZone = Math.max(1, ...zones.map((z) => z.n));

  return (
    <>
      <PageHeader title="Overview" desc={isAdmin ? "Everything happening across the association." : "Applications waiting for your review."}>
        <Link href="/dashboard/applications" className="btn-accent">
          Review applications <ArrowRight size={16} weight="bold" />
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Pending review" value={c.pending ?? 0} icon={Clock} hint="Oldest first in the queue" />
        <StatCard label="Approved members" value={c.approved ?? 0} icon={CheckCircle} />
        <StatCard label="Rejected" value={c.rejected ?? 0} icon={XCircle} />
        <StatCard label="Received this week" value={week.n} icon={ClipboardText} hint="Last 7 days" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Needs review</h2>
            <Link href="/dashboard/applications" className="text-sm font-medium text-ink underline underline-offset-4 hover:no-underline">
              View all
            </Link>
          </div>
          {queue.length ? (
            <ul className="divide-y divide-line">
              {queue.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/applications/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-ink/[0.03]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-sm font-mono font-medium uppercase">
                      {a.name.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {a.company} · {a.employeeId} · {a.circle}
                      </span>
                    </span>
                    <span className="hidden text-xs text-muted sm:block">{fmtDate(a.createdAt)}</span>
                    <ArrowRight size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Tray} title="All caught up" body="There are no applications waiting for review right now." />
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Members by zone</h2>
          {zones.length ? (
            <ul className="mt-5 space-y-4">
              {zones.map((z) => (
                <li key={z.zone}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{z.zone}</span>
                    <span className="font-semibold tabular-nums">{z.n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-sm bg-surface-2">
                    <div className="h-full rounded-sm bg-ink/80" style={{ width: `${(z.n / maxZone) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={UsersThree} title="No members yet" body="Approved members will be counted here by zone." />
          )}
        </section>
      </div>
    </>
  );
}

async function MemberHome({ applicationId }: { applicationId: string | null }) {
  const [a] = applicationId
    ? await db
        .select({
          id: applications.id, name: applications.name, fatherName: applications.fatherName, designation: applications.designation,
          company: applications.company, employeeId: applications.employeeId, membershipNo: applications.membershipNo,
          zone: applications.zone, circle: applications.circle, division: applications.division, subDivision: applications.subDivision,
          contact: applications.contact, email: applications.email, reviewedAt: applications.reviewedAt, qualification: applications.qualification,
          pvcCardRequested: applications.pvcCardRequested,
          discipline: applications.discipline, posting: applications.posting, headquarters: applications.headquarters, bloodGroup: applications.bloodGroup,
        })
        .from(applications)
        .where(eq(applications.id, applicationId))
    : [];

  if (!a) return <EmptyState icon={Tray} title="No membership found" body="This account is not linked to a membership. Please contact the admin." />;

  const charges = RAZORPAY_ENABLED ? await db.select().from(payments).where(eq(payments.applicationId, a.id)) : [];
  const cardPaid = charges.some(p => p.pvcAmount > 0 && p.status === "paid");
  const cardCharge = charges.find(p => p.purpose === "pvc_card");
  return (
    <>
      <PageHeader title={`Welcome, ${a.name.split(" ")[0]}`} desc="Your membership with the Association of Junior Engineers, Punjab.">
        <a href={`/api/card/${a.id}`} target="_blank" rel="noopener" className="btn-accent">
          <IdentificationCard size={18} weight="bold" /> Membership Card (PDF)
        </a>
      </PageHeader>
      {RAZORPAY_ENABLED && a.pvcCardRequested && (cardPaid
        ? <p className="mb-5 rounded-lg bg-accent-soft p-3 text-sm font-semibold text-accent">PVC card payment received: Rs.200/-.</p>
        : <div className="mb-5"><RazorpayPayment applicationId={a.id} purpose="pvc_card" amount={PVC_CARD_PAISE} pvcAmount={PVC_CARD_PAISE}
            initialStatus={cardCharge?.status} initialPaymentId={cardCharge?.razorpayPaymentId} /></div>)}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Member card */}
        <div className="card relative overflow-hidden p-6">
          <div className="relative flex items-center justify-between">
            <span className="eyebrow">AOJE Punjab</span>
            <StatusBadge status="approved" />
          </div>
          <div className="relative mt-6 flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- auth-protected photo route */}
            <img src={`/api/photo/${a.id}`} alt={`${a.name}'s photo`} className="h-28 w-22 rounded-xl border border-line object-cover" />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-bold tracking-tight">{a.name}</p>
              <p className="text-sm text-muted">{a.designation}</p>
              <p className="mt-3 text-xs text-muted">Membership No.</p>
              <p className="font-mono text-lg font-medium">{a.membershipNo}</p>
            </div>
          </div>
          <dl className="relative mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <Detail label="Organisation" value={a.company} />
            <Detail label="Employee ID" value={a.employeeId} />
            <Detail label="Member since" value={fmtDate(a.reviewedAt)} />
            <Detail label="Circle" value={a.circle} />
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Your details</h2>
          <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Father's Name" value={a.fatherName} />
            <Detail label="Mobile" value={a.contact} />
            <Detail label="Email" value={a.email} />
            <Detail label="Qualification" value={`${a.qualification} (${a.discipline})`} />
            <Detail label="Blood Group" value={a.bloodGroup ?? "Not recorded"} />
            <Detail label="Zone" value={a.zone} />
            <Detail label="Division" value={a.division} />
            <Detail label="Sub Division" value={a.subDivision} />
            <Detail label="Headquarters" value={a.headquarters} />
            <Detail label="Posting" value={a.posting} wide />
          </dl>
          <p className="mt-6 rounded-md bg-surface-2 p-3 text-sm text-muted">
            To correct any detail, please contact the Operation Team. You can change your password from{" "}
            <Link href="/dashboard/account" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
              Account
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
