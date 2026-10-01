import { ArrowLeft, Briefcase, ChatText, CheckCircle, EnvelopeSimple, IdentificationCard, TreeStructure, User } from "@phosphor-icons/react/ssr";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { applications, notifications, users } from "@/db/schema";
import { requireRole, STAFF } from "@/lib/auth";
import { AccountControls, ReviewPanel } from "../../forms";
import { Detail, fmtDate, StatusBadge } from "../../ui";

const reviewer = alias(users, "reviewer");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationDetail({ params }: PageProps<"/dashboard/applications/[id]">) {
  const me = await requireRole(STAFF);
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // Everything except the photo bytes (served separately by /api/photo/[id]).
  const { photo, ...cols } = getTableColumns(applications);
  void photo;
  const [row] = await db
    .select({ a: cols, reviewerId: reviewer.loginId, member: { id: users.id, loginId: users.loginId, active: users.active } })
    .from(applications)
    .leftJoin(reviewer, eq(reviewer.id, applications.reviewedBy))
    .leftJoin(users, eq(users.applicationId, applications.id))
    .where(eq(applications.id, id))
    .limit(1);
  if (!row) notFound();
  const { a, reviewerId, member } = row;
  const messages = await db
    .select({ id: notifications.id, kind: notifications.kind, channel: notifications.channel, status: notifications.status, error: notifications.error, at: notifications.createdAt })
    .from(notifications)
    .where(eq(notifications.applicationId, id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return (
    <>
      <Link href="/dashboard/applications" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} weight="bold" /> Applications
      </Link>

      <div className="card mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- auth-protected photo route */}
        <img src={`/api/photo/${a.id}`} alt={`${a.name}'s passport photo`} className="h-36 w-28 shrink-0 rounded-xl border border-line object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{a.name}</h1>
            <StatusBadge status={a.status} />
          </div>
          <p className="mt-1 text-muted">
            {a.designation} · {a.company} · Employee ID {a.employeeId}
          </p>
          <p className="mt-3 text-sm text-muted">Submitted {fmtDate(a.createdAt)}</p>
        </div>
        {a.membershipNo && (
          <div className="rounded-xl bg-accent-soft px-5 py-3 text-center">
            <p className="text-xs text-muted">Membership No.</p>
            <p className="font-mono text-xl font-semibold text-accent">{a.membershipNo}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <Section icon={User} title="Personal Details">
            <Detail label="Full Name" value={a.name} />
            <Detail label="Father's Name" value={a.fatherName} />
            <Detail label="Date of Birth" value={fmtDate(a.dob)} />
            <Detail label="Mobile" value={<a href={`tel:${a.contact}`} className="text-accent hover:underline">{a.contact}</a>} />
            <Detail label="Email" value={<a href={`mailto:${a.email}`} className="text-accent hover:underline">{a.email}</a>} />
            <Detail label="Pin Code" value={a.pinCode} />
            <Detail label="Residential Address" value={a.address} wide />
          </Section>
          <Section icon={Briefcase} title="Service Details">
            <Detail label="Organisation" value={a.company} />
            <Detail label="Designation" value={a.designation} />
            <Detail label="Employee ID" value={a.employeeId} />
            <Detail label="Qualification" value={`${a.qualification} (${a.discipline})`} />
            <Detail label="Joined PSPCL/PSTCL" value={`${fmtDate(a.dojCompany)} as ${a.dojCompanyAs}`} />
            <Detail label="Current Post" value={`${a.dojCurrentPostAs} since ${fmtDate(a.dojCurrentPost)}`} />
          </Section>
          <Section icon={TreeStructure} title="Posting Details">
            <Detail label="Zone" value={a.zone} />
            <Detail label="Circle" value={a.circle} />
            <Detail label="Division / Office" value={a.division} />
            <Detail label="Sub Division / Office" value={a.subDivision} />
            <Detail label="Office Address" value={a.officeAddress} wide />
          </Section>
          <p className="flex items-center gap-2 text-sm text-muted">
            <CheckCircle size={18} weight="fill" className="text-accent" /> Applicant accepted the membership declaration and salary deduction.
          </p>
        </div>

        <aside className="card space-y-5 p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold">Review</h2>
          {/* Always mounted so freshly issued credentials survive the refresh after approval. */}
          <ReviewPanel applicationId={a.id} pending={a.status === "pending"} />

          {a.status === "approved" && (
            <>
              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Membership No." value={a.membershipNo} />
                <Detail label="Login ID" value={member?.loginId} />
                <Detail label="Approved by" value={reviewerId} />
                <Detail label="Approved on" value={fmtDate(a.reviewedAt)} />
                <Detail
                  label="Account"
                  value={member?.active ? <span className="text-accent">Active</span> : <span className="text-danger">Turned off</span>}
                />
              </dl>
              <a href={`/api/card/${a.id}`} target="_blank" rel="noopener" className="btn-outline w-full py-2.5">
                <IdentificationCard size={18} weight="bold" /> Membership Card (PDF)
              </a>
              {me.role === "admin" && member?.id && (
                <div className="border-t border-line pt-4">
                  <p className="mb-3 text-sm font-medium">Member account</p>
                  <AccountControls userId={member.id} active={member.active} />
                </div>
              )}
            </>
          )}

          {a.status === "rejected" && (
            <dl className="grid gap-4">
              <Detail label="Reason" value={a.rejectionReason} />
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Rejected by" value={reviewerId} />
                <Detail label="Rejected on" value={fmtDate(a.reviewedAt)} />
              </div>
            </dl>
          )}
        
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-sm font-medium">Messages to applicant</p>
            {messages.length ? (
              <ul className="space-y-2.5">
                {messages.map((m) => (
                  <li key={m.id} className="flex items-start gap-2.5 text-xs">
                    {m.channel === "email" ? (
                      <EnvelopeSimple size={16} className="mt-px shrink-0 text-muted" />
                    ) : (
                      <ChatText size={16} className="mt-px shrink-0 text-muted" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block">
                        <span className="font-semibold">{KIND[m.kind]}</span> {m.channel === "email" ? "email" : "SMS"}{" "}
                        <span className={m.status === "sent" ? "text-accent" : m.status === "failed" ? "text-danger" : "text-muted"}>
                          {m.status === "skipped" ? "not set up" : m.status}
                        </span>
                      </span>
                      <span className="block text-muted">{fmtDateTime(m.at)}</span>
                      {m.status === "failed" && m.error && <span className="block break-words text-danger/80">{m.error}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No messages sent yet.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

const KIND = { received: "Received", approved: "Approval", rejected: "Rejection", password: "Password" } as const;
const fmtDateTime = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon size={18} weight="duotone" className="text-accent" /> {title}
      </h2>
      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}
