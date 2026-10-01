import type { Icon } from "@phosphor-icons/react";
import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react/ssr";

export { fmtDate } from "@/lib/format";

export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-1.5 text-muted">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const STATUS = {
  pending: { label: "Pending", icon: Clock, cls: "bg-amber-500/12 text-amber-500 light:text-amber-700" },
  approved: { label: "Approved", icon: CheckCircle, cls: "bg-accent-soft text-accent" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-danger/12 text-danger" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <s.icon size={13} weight="fill" /> {s.label}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: number | string; icon: Icon; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
          <Icon size={18} weight="duotone" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: Icon; title: string; body: string }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-ink/[0.05] text-muted">
        <Icon size={26} weight="duotone" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
    </div>
  );
}

export function Detail({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value || "-"}</dd>
    </div>
  );
}
