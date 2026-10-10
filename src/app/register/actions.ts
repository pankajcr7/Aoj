"use server";

import { randomUUID } from "node:crypto";
import { grantPaymentAccess } from "@/lib/payment-access";
import { RAZORPAY_ENABLED, registrationCharge } from "@/lib/payment-rules";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { applications, payments } from "@/db/schema";
import { applicationSchema, type ApplicationField, fileOf, imageError, stringsOf } from "@/lib/application-schema";
import { refFor } from "@/lib/messages";
import { BLOOD_GROUPS, MEMBERSHIP_TYPES } from "@/lib/form-options";
import { notify } from "@/lib/notify";

const schema = applicationSchema.extend({
  correspondingAddress: z.string().trim().min(1, "Required").max(300),
  bloodGroup: z.enum(BLOOD_GROUPS, "Select blood group"),
  membershipType: z.enum(MEMBERSHIP_TYPES, "Select membership type"),
  declarationAccepted: z.literal("on", "You must accept the declaration"),
});

export type FormErrors = Partial<Record<ApplicationField | "declarationAccepted" | "photo" | "signature", string[]>>;

export type RegisterState = {
  ok?: boolean;
  ref?: string;
  payment?: { applicationId: string; amount: number; membershipAmount: number; pvcAmount: number };
  message?: string;
  errors?: FormErrors;
};

export async function register(_: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse(stringsOf(formData));
  const photo = fileOf(formData, "photo");
  const signature = fileOf(formData, "signature");

  const photoError = photo ? imageError(photo) : "Passport-size photo is required";
  const signatureError = signature && imageError(signature);

  if (!parsed.success || photoError || signatureError) {
    const errors: FormErrors = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;
    if (photoError) errors.photo = [photoError];
    if (signatureError) errors.signature = [signatureError];
    return { errors, message: "Please fix the highlighted fields." };
  }

  const { declarationAccepted, ...fields } = parsed.data;
  void declarationAccepted;
  const id = randomUUID();
  const charge = RAZORPAY_ENABLED ? registrationCharge(fields.membershipType, fields.pvcCardPayment)! : null;
  try {
    await db.batch([
      db.insert(applications).values({
        id, ...fields,
        pvcCardRequested: RAZORPAY_ENABLED ? !!fields.pvcCardPayment : fields.pvcCardRequested,
        pvcCardPayment: RAZORPAY_ENABLED ? fields.pvcCardPayment : null,
        declarationAccepted: true,
        photo: Buffer.from(await photo!.arrayBuffer()), photoType: photo!.type,
        ...(signature && { signature: Buffer.from(await signature.arrayBuffer()), signatureType: signature.type }),
      }),
      ...(charge ? [db.insert(payments).values({ applicationId: id, purpose: "registration", ...charge })] : []),
    ]);
  } catch (e) {
    // 23505 = unique_violation (employee_id)
    if ((e as { cause?: { code?: string } }).cause?.code === "23505" || (e as { code?: string }).code === "23505") {
      return { errors: { employeeId: ["An application with this Employee ID already exists"] } };
    }
    throw e;
  }

  if (RAZORPAY_ENABLED) await grantPaymentAccess(id);
  const { name, email, contact } = parsed.data;
  after(() => notify("received", { id, name, email, contact })); // don't make the applicant wait on email/SMS
  return { ok: true, ref: refFor(id), ...(charge && { payment: { applicationId: id, ...charge } }) };
}
