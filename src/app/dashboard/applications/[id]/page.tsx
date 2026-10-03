import { ArrowLeft, ChatText, EnvelopeSimple, IdentificationCard } from "@phosphor-icons/react/ssr";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MembershipForm } from "@/app/register/register-form";
import { db } from "@/db";
import { applicationEdits, applications, notifications, users } from "@/db/schema";
import { FIELD_LABELS } from "@/lib/application-schema";
import { requireRole, STAFF } from "@/lib/auth";
import { AccountControls, ReviewPanel } from "../../forms";
import { StatusBadge } from "../../ui";

const reviewer = alias(users, "reviewer");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationDetail({ params }: PageProps<"/dashboard/applications/[id]">) {
  const me = await requireRole(STAFF);
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // Everything except the image bytes (served separately by /api/photo/[id]).
  const { photo, signature, ...cols } = getTableColumns(applications);
  void photo;
  void signature;
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
  const edits = await db
    .select({ at: applicationEdits.createdAt, field: applicationEdits.field, oldValue: applicationEdits.oldValue, newValue: applicationEdits.newValue, remarks: applicationEdits.remarks, by: users.loginId })
    .from(applicationEdits)
    .leftJoin(users, eq(users.id, applicationEdits.changedBy))
    .where(eq(applicationEdits.applicationId, id))
    .orderBy(applicationEdits.createdAt);

  const values = Object.fromEntries(
    Object.entries(a).map(([k, v]) => [k, v instanceof Date ? isoDate(v) : v == null ? null : String(v)]),
  );
  values.reviewer = reviewerId;
  values.loginId = member?.loginId ?? null;
  const events: [Date, string, string][] = [[a.createdAt, "Application submitted", a.name]];
  if (a.reviewedAt) events.push([a.reviewedAt, a.status === "approved" ? "Approved" : "Rejected", reviewerId ?? "-"]);
  for (const ed of edits) {
    const label = FIELD_LABELS[ed.field as keyof typeof FIELD_LABELS] ?? ed.field;
    const change = ed.oldValue === null ? ed.newValue : `${ed.oldValue || "(empty)"} → ${ed.newValue || "(empty)"}`;
    events.push([ed.at, `${label}: ${change}${ed.remarks ? ` (${ed.remarks})` : ""}`, ed.by ?? "-"]);
  }
  const audit = events.sort((x, y) => +x[0] - +y[0]).map(([at, what, by]): [string, string, string] => [fmtDateTime(at), what, by]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/applications" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} weight="bold" /> Applications
        </Link>
        <StatusBadge status={a.status} />
      </div>

      <MembershipForm
        saved={{ id: a.id, status: a.status, hasSignature: !!a.signatureType, values, audit, masterId: me.loginId, canEdit: me.role === "admin" }}
        office={
          <div className="space-y-4">
            {/* Always mounted so freshly issued credentials survive the refresh after approval. */}
            <ReviewPanel applicationId={a.id} pending={a.status === "pending"} />
            {a.status === "approved" && (
              <>
                <a href={`/api/card/${a.id}`} target="_blank" rel="noopener" className="btn-outline w-full py-2.5">
                  <IdentificationCard size={18} weight="bold" /> Membership Card (PDF)
                </a>
                {me.role === "admin" && member?.id && (
                  <div>
                    <p className="mb-3 text-sm font-medium">Member account</p>
                    <AccountControls userId={member.id} active={member.active} />
                  </div>
                )}
              </>
            )}
          </div>
        }
      />

      <section className="card mt-6 p-5">
        <p className="mb-3 text-sm font-medium">Messages to applicant</p>
        {messages.length ? (
          <ul className="grid gap-2.5 sm:grid-cols-2">
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
      </section>
    </>
  );
}

const KIND = { received: "Received", approved: "Approval", rejected: "Rejection", password: "Password" } as const;
const fmtDateTime = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
const isoDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
