"use server";

import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { applicationEdits, applications, users } from "@/db/schema";
import { applicationSchema, fileOf, imageError, stringsOf } from "@/lib/application-schema";
import type { FormErrors } from "@/app/register/actions";
import { requireRole, STAFF } from "@/lib/auth";
import { generatePassword, memberLoginId, membershipNo } from "@/lib/credentials";
import { notify, type Delivery } from "@/lib/notify";

export type Credentials = { error?: string; loginId?: string; password?: string; membershipNo?: string; delivery?: Delivery };
export type Result = { error?: string; ok?: boolean; delivery?: Delivery };

const contactOf = async (applicationId: string) =>
  (
    await db
      .select({ id: applications.id, name: applications.name, email: applications.email, contact: applications.contact })
      .from(applications)
      .where(eq(applications.id, applicationId))
  )[0];

const refresh = () => revalidatePath("/dashboard", "layout");
const isUnique = (e: unknown) =>
  (e as { code?: string }).code === "23505" || (e as { cause?: { code?: string } }).cause?.code === "23505";

/** Approve a pending application: issue membership number + member login in one atomic statement. */
export async function approveApplication(applicationId: string): Promise<Credentials> {
  const reviewer = await requireRole(STAFF);
  const { rows } = await db.execute<{ n: number }>(sql`select nextval('membership_seq')::int as n`);
  const n = rows[0].n;
  const password = generatePassword();
  const loginId = memberLoginId(n);
  const hash = await bcrypt.hash(password, 12);

  // One statement = atomic: the user is only created if the application was still pending.
  const created = await db.execute(sql`
    with upd as (
      update applications
      set status = 'approved', membership_no = ${membershipNo(n)}, reviewed_by = ${reviewer.id}, reviewed_at = now(), rejection_reason = null
      where id = ${applicationId} and status = 'pending'
      returning id
    )
    insert into users (login_id, password_hash, application_id)
    select ${loginId}, ${hash}, id from upd
    returning id`);

  if (!created.rows.length) return { error: "This application was already reviewed." };
  refresh();
  const delivery = await notify("approved", await contactOf(applicationId), { membershipNo: membershipNo(n), loginId, password });
  return { loginId, password, membershipNo: membershipNo(n), delivery };
}

export async function rejectApplication(applicationId: string, _: Result, formData: FormData): Promise<Result> {
  const reviewer = await requireRole(STAFF);
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Please give a short reason (at least 5 characters)." };

  const updated = await db
    .update(applications)
    .set({ status: "rejected", rejectionReason: reason.slice(0, 500), reviewedBy: reviewer.id, reviewedAt: new Date() })
    .where(and(eq(applications.id, applicationId), eq(applications.status, "pending")))
    .returning({ id: applications.id, name: applications.name, email: applications.email, contact: applications.contact });

  if (!updated.length) return { error: "This application was already reviewed." };
  refresh();
  return { ok: true, delivery: await notify("rejected", updated[0], { reason }) };
}

/** Admin: issue a fresh password for any account (member or staff). */
export async function resetPassword(userId: string): Promise<Credentials> {
  await requireRole(["admin"]);
  const password = generatePassword();
  const [user] = await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 12) })
    .where(eq(users.id, userId))
    .returning({ loginId: users.loginId, applicationId: users.applicationId });
  if (!user) return { error: "Account not found." };
  // Members get the new password by email/SMS; staff accounts have no contact details on file.
  const delivery = user.applicationId
    ? await notify("password", await contactOf(user.applicationId), { loginId: user.loginId, password })
    : undefined;
  return { loginId: user.loginId, password, delivery };
}

/** Admin: turn an account on or off (cannot turn off yourself). */
export async function setActive(userId: string, active: boolean) {
  const admin = await requireRole(["admin"]);
  if (admin.id === userId) return;
  await db.update(users).set({ active }).where(eq(users.id, userId));
  refresh();
}

const staffSchema = z.object({
  loginId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, "3-32 characters: letters, numbers, dot, dash or underscore"),
  role: z.enum(["admin", "operations"]),
});

export async function createStaff(_: Credentials, formData: FormData): Promise<Credentials> {
  await requireRole(["admin"]);
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (/^aoj\d+$/.test(parsed.data.loginId)) return { error: "IDs like aoj0001 are reserved for members." };

  const password = generatePassword();
  try {
    await db.insert(users).values({ ...parsed.data, passwordHash: await bcrypt.hash(password, 12) });
  } catch (e) {
    if (isUnique(e)) return { error: "That login ID is already taken." };
    throw e;
  }
  refresh();
  return { loginId: parsed.data.loginId, password };
}

/** Any signed-in user: change own password. */
export async function changePassword(_: Result, formData: FormData): Promise<Result> {
  const me = await requireRole(["admin", "operations", "member"]);
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== formData.get("confirm")) return { error: "New passwords do not match." };

  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id));
  if (!row || !(await bcrypt.compare(current, row.hash))) return { error: "Current password is incorrect." };

  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(users.id, me.id));
  return { ok: true };
}

export type EditResult = { ok?: boolean; message?: string; errors?: FormErrors };

/** Master ID (admin) corrects a submitted form. Every changed field is logged to the audit trail. */
export async function updateApplication(applicationId: string, formData: FormData): Promise<EditResult> {
  const me = await requireRole(["admin"]);
  const parsed = applicationSchema.safeParse(stringsOf(formData));
  const photo = fileOf(formData, "photo");
  const signature = fileOf(formData, "signature");
  const errors: FormErrors = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;
  if (photo && imageError(photo)) errors.photo = [imageError(photo)!];
  if (signature && imageError(signature)) errors.signature = [imageError(signature)!];
  if (!parsed.success || Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const [current] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (!current) return { message: "Application not found." };

  const changed = Object.entries(parsed.data).filter(([k, v]) => (current[k as keyof typeof current] ?? "") !== (v ?? ""));
  const remarks = String(formData.get("editRemarks") ?? "").trim().slice(0, 500) || null;
  const log = (field: string, oldValue: string | null, newValue: string | null) =>
    ({ applicationId, field, oldValue, newValue, remarks, changedBy: me.id });
  const edits = changed.map(([k, v]) => log(k, (current[k as keyof typeof current] as string | null) ?? null, v ?? null));
  if (photo) edits.push(log("photo", null, "New photo uploaded"));
  if (signature) edits.push(log("signature", null, "New signature uploaded"));
  if (!edits.length) return { message: "Nothing was changed." };

  try {
    await db.batch([
      db
        .update(applications)
        .set({
          ...Object.fromEntries(changed),
          ...(photo && { photo: Buffer.from(await photo.arrayBuffer()), photoType: photo.type }),
          ...(signature && { signature: Buffer.from(await signature.arrayBuffer()), signatureType: signature.type }),
        })
        .where(eq(applications.id, applicationId)),
      db.insert(applicationEdits).values(edits),
    ]);
  } catch (e) {
    if (isUnique(e)) return { errors: { employeeId: ["Another application already has this Employee ID"] } };
    throw e;
  }
  refresh();
  return { ok: true };
}
