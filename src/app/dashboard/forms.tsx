"use client";

import { ArrowClockwise, ChatText, Check, CheckCircle, Copy, EnvelopeSimple, Power, UserPlus, WarningCircle, XCircle } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
import {
  approveApplication,
  changePassword,
  createStaff,
  rejectApplication,
  resetPassword,
  setActive,
  setMembershipStatus,
  type Credentials,
  type Result,
} from "./actions";

function Alert({ msg, tone = "danger" }: { msg?: string; tone?: "danger" | "ok" }) {
  if (!msg) return null;
  const Icon = tone === "ok" ? CheckCircle : WarningCircle;
  return (
    <p className={`flex items-center gap-1.5 text-sm ${tone === "ok" ? "text-accent" : "text-danger"}`} aria-live="polite">
      <Icon size={16} weight="fill" className="shrink-0" /> {msg}
    </p>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-ink/[0.04] px-3 py-2">
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block truncate font-mono text-sm font-semibold">{value}</span>
      </span>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
        className="btn-outline shrink-0 px-2.5 py-1.5 text-xs"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

type Delivery = NonNullable<Credentials["delivery"]>;
const DELIVERY_LABEL = { sent: "sent", skipped: "not set up", failed: "failed" } as const;

/** One line per channel: did the email / SMS actually go out? */
export function DeliveryNote({ delivery }: { delivery?: Delivery }) {
  if (!delivery) return null;
  const allSent = delivery.email === "sent" && delivery.sms === "sent";
  return (
    <div className="space-y-1.5 text-xs">
      {([
        ["Email", EnvelopeSimple, delivery.email],
        ["SMS", ChatText, delivery.sms],
      ] as const).map(([label, Icon, status]) => (
        <p key={label} className={`flex items-center gap-1.5 ${status === "sent" ? "text-accent" : status === "failed" ? "text-danger" : "text-muted"}`}>
          <Icon size={14} weight="fill" /> {label} {DELIVERY_LABEL[status]}
        </p>
      ))}
      {!allSent && <p className="text-muted">Please pass the details on another way as well.</p>}
    </div>
  );
}

/** Shows freshly issued credentials once. */
export function SecretBox({ title, creds }: { title: string; creds: Credentials }) {
  if (!creds.password) return null;
  return (
    <div className="space-y-2 rounded-xl border border-accent/40 bg-accent-soft p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle size={18} weight="fill" className="text-accent" /> {title}
      </p>
      {creds.membershipNo && <CopyRow label="Membership No." value={creds.membershipNo} />}
      {creds.loginId && <CopyRow label="Login ID" value={creds.loginId} />}
      <CopyRow label="Password" value={creds.password} />
      <DeliveryNote delivery={creds.delivery} />
      <p className="text-xs text-muted">The password is not shown again after you leave this page.</p>
    </div>
  );
}

export function ReviewPanel({ applicationId, pending, paymentNotReceived }: { applicationId: string; pending: boolean; paymentNotReceived: boolean }) {
  const [approved, approve, approving] = useActionState(
    (_: Credentials, formData: FormData) => approveApplication(applicationId, formData.get("confirmUnpaid") === "yes"),
    {} as Credentials,
  );
  const [rejected, reject, rejecting] = useActionState(rejectApplication.bind(null, applicationId), {} as Result);
  const [confirming, setConfirming] = useState(false);
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const needsPaymentConfirmation = RAZORPAY_ENABLED && (paymentNotReceived || approved.paymentConfirmationRequired);

  if (approved.password) return <SecretBox title="Application approved. Member login created." creds={approved} />;
  if (rejected.ok)
    return (
      <div className="space-y-2 rounded-xl border border-line bg-ink/[0.03] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <XCircle size={18} weight="fill" className="text-danger" /> Application rejected. Applicant notified:
        </p>
        <DeliveryNote delivery={rejected.delivery} />
      </div>
    );
  if (!pending) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink/[0.05] p-1 text-sm font-semibold">
        {(["approve", "reject"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setConfirming(false); }}
            className={`rounded-md py-2 capitalize transition ${mode === m ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "approve" ? (
        <form action={approve} className="space-y-3">
          <p className="text-sm text-muted">
            Approving issues a membership number and creates the member&apos;s login. Check the details and photo first.
          </p>
          {confirming ? (
            <div className="space-y-3">
              {needsPaymentConfirmation && (
                <>
                  <Alert msg="Payment is not received. Are you sure you want to accept the application?" />
                  <input type="hidden" name="confirmUnpaid" value="yes" />
                </>
              )}
              <div className="flex gap-2">
                <button disabled={approving} className="btn-accent flex-1 py-3">
                  <CheckCircle size={18} weight="bold" /> {approving ? "Approving…" : "Yes, approve"}
                </button>
                <button type="button" disabled={approving} onClick={() => setConfirming(false)} className="btn-outline py-3">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="btn-accent w-full py-3">
              <CheckCircle size={18} weight="bold" /> Approve Application
            </button>
          )}
          <Alert msg={approved.paymentConfirmationRequired && confirming ? undefined : approved.error} />
        </form>
      ) : (
        <form action={reject} className="space-y-3">
          <label htmlFor="reason" className="block text-sm font-medium">
            Reason for rejection
          </label>
          <textarea id="reason" name="reason" rows={3} required className="field resize-none" placeholder="For example: Employee ID does not match records" />
          <button disabled={rejecting} className="btn w-full border border-danger/40 bg-danger/10 py-3 text-danger hover:bg-danger/15">
            <XCircle size={18} weight="bold" /> {rejecting ? "Rejecting…" : "Reject Application"}
          </button>
          <Alert msg={rejected.error} />
        </form>
      )}
    </div>
  );
}

/** Admin controls for any account: reset password, turn on/off. */
export function AccountControls({ userId, active, noToggle }: { userId: string; active: boolean; noToggle?: boolean }) {
  const [creds, reset, resetting] = useActionState(() => resetPassword(userId), {} as Credentials);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={reset}>
          <button disabled={resetting} className="btn-outline px-3 py-2 text-xs">
            <ArrowClockwise size={14} weight="bold" /> {resetting ? "Resetting…" : "Reset password"}
          </button>
        </form>
        {!noToggle && (
          <form action={setActive.bind(null, userId, !active)}>
            <button className={`btn-outline px-3 py-2 text-xs ${active ? "text-danger" : "text-accent"}`}>
              <Power size={14} weight="bold" /> {active ? "Turn off" : "Turn on"}
            </button>
          </form>
        )}
      </div>
      <SecretBox title="New password issued" creds={creds} />
      <Alert msg={creds.error} />
    </div>
  );
}

const MOVES = {
  approved: [["suspended", "Suspend"], ["terminated", "Terminate"]],
  suspended: [["approved", "Reactivate"], ["terminated", "Terminate"]],
  terminated: [["approved", "Reactivate"]],
} as const;

/** Master ID: suspend / terminate / reactivate. The member's login follows the status. */
export function MembershipControls({ applicationId, status }: { applicationId: string; status: keyof typeof MOVES }) {
  const [state, action, pending] = useActionState(setMembershipStatus.bind(null, applicationId), {} as Result);
  return (
    <form action={action} className="space-y-3" key={status}>
      <label htmlFor="remarks" className="block text-sm font-medium">
        Reason / authority
      </label>
      <textarea
        id="remarks"
        name="remarks"
        rows={2}
        required
        className="field resize-none"
        placeholder="e.g. Misconduct, as decided by the State Committee on 05-10-2026"
      />
      <div className="flex flex-wrap gap-2">
        {MOVES[status].map(([to, label]) => (
          <button
            key={to}
            name="to"
            value={to}
            disabled={pending}
            className={`btn-outline px-3 py-2 text-xs ${to === "approved" ? "text-accent" : "text-danger"}`}
          >
            <Power size={14} weight="bold" /> {label}
          </button>
        ))}
      </div>
      <Alert msg={state.error} />
    </form>
  );
}

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(createStaff, {} as Credentials);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="loginId" className="text-sm font-medium">
          Login ID
        </label>
        <input id="loginId" name="loginId" required placeholder="e.g. ops.patiala" className="field" autoComplete="off" />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Role</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["operations", "Operation Team"],
            ["admin", "Admin"],
          ].map(([v, l], i) => (
            <label
              key={v}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-line px-3 py-2.5 text-sm font-semibold transition has-checked:border-accent has-checked:bg-accent-soft"
            >
              <input type="radio" name="role" value={v} defaultChecked={i === 0} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <button disabled={pending} className="btn-accent w-full py-3">
        <UserPlus size={18} weight="bold" /> {pending ? "Creating…" : "Create Account"}
      </button>
      <p className="text-xs text-muted">A secure password is generated for you.</p>
      <Alert msg={state.error} />
      <SecretBox title="Staff account created" creds={state} />
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as Result);
  return (
    <form action={action} className="space-y-4" key={state.ok ? "done" : "form"}>
      {[
        ["current", "Current password", "current-password"],
        ["next", "New password", "new-password"],
        ["confirm", "Confirm new password", "new-password"],
      ].map(([name, label, ac]) => (
        <div key={name} className="grid gap-2">
          <label htmlFor={name} className="text-sm font-medium">
            {label}
          </label>
          <input id={name} name={name} type="password" required minLength={name === "current" ? 1 : 8} autoComplete={ac} className="field" />
        </div>
      ))}
      <button disabled={pending} className="btn-accent w-full py-3">
        {pending ? "Saving…" : "Change Password"}
      </button>
      <Alert msg={state.error} />
      <Alert msg={state.ok ? "Password changed." : undefined} tone="ok" />
    </form>
  );
}
