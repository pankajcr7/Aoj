import "server-only";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { buildMessage, refFor, type Kind, type MessageData } from "./messages";

export type Status = "sent" | "skipped" | "failed";
export type Delivery = { email: Status; sms: Status };
type Outcome = [Status, string?];

const env = process.env;
const port = Number(env.SMTP_PORT ?? 587);
const mailer = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
  : null;

const SMS_TEMPLATE: Record<Kind, string | undefined> = {
  received: env.MSG91_TEMPLATE_RECEIVED,
  approved: env.MSG91_TEMPLATE_APPROVED,
  rejected: env.MSG91_TEMPLATE_REJECTED,
  password: env.MSG91_TEMPLATE_PASSWORD,
};

export type Attachment = { filename: string; content: Uint8Array; contentType: string };

async function sendEmail(to: string, msg: { subject: string; html: string; text: string }, attachments?: Attachment[]): Promise<Outcome> {
  if (!mailer) return ["skipped", "Email not configured (SMTP_HOST)"];
  try {
    await mailer.sendMail({
      from: env.MAIL_FROM ?? env.SMTP_USER,
      to,
      ...msg,
      attachments: attachments?.map((a) => ({ ...a, content: Buffer.from(a.content) })),
    });
    return ["sent"];
  } catch (e) {
    return ["failed", (e as Error).message.slice(0, 300)];
  }
}

// MSG91 Flow API: one DLT-approved template per message kind; variables are named in the template.
async function sendSms(mobile: string, kind: Kind, vars: Record<string, string>): Promise<Outcome> {
  const templateId = SMS_TEMPLATE[kind];
  if (!env.MSG91_AUTH_KEY || !templateId) return ["skipped", "SMS not configured (MSG91)"];
  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers: { authkey: env.MSG91_AUTH_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ template_id: templateId, short_url: "0", recipients: [{ mobiles: `91${mobile}`, ...vars }] }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
    if (!res.ok || data.type === "error") return ["failed", String(data.message ?? `HTTP ${res.status}`).slice(0, 300)];
    return ["sent"];
  } catch (e) {
    return ["failed", (e as Error).message.slice(0, 300)];
  }
}

type Recipient = { id: string; name: string; email: string; contact: string };

/** Sends email + SMS in parallel and logs the outcome. Never throws: a failed message must not undo the action. */
export async function notify(
  kind: Kind,
  to: Recipient,
  extra: Omit<MessageData, "name" | "ref" | "loginUrl"> = {},
  attachments?: Attachment[],
): Promise<Delivery> {
  const loginUrl = `${(env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/login`;
  const msg = buildMessage(kind, { name: to.name, ref: refFor(to.id), loginUrl, ...extra });
  const [[email, emailError], [sms, smsError]] = await Promise.all([
    sendEmail(to.email, msg.email, attachments),
    sendSms(to.contact, kind, msg.sms),
  ]);

  await db
    .insert(notifications)
    .values([
      { applicationId: to.id, kind, channel: "email", status: email, recipient: to.email, error: emailError },
      { applicationId: to.id, kind, channel: "sms", status: sms, recipient: to.contact, error: smsError },
    ])
    .catch((e) => console.error("notification log failed", e));

  return { email, sms };
}
