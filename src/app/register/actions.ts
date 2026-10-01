"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { refFor } from "@/lib/messages";
import { notify } from "@/lib/notify";

const MAX_PHOTO = 500 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"]; // what the PDF card can embed; the form converts other formats

const text = z.string().trim().min(1, "Required").max(300);
const pastDate = z.iso.date("Enter a valid date").refine((d) => new Date(d) <= new Date(), "Cannot be in the future");

const schema = z.object({
  name: text,
  fatherName: text,
  designation: text,
  dob: pastDate,
  address: text,
  pinCode: z.string().regex(/^[1-9]\d{5}$/, "6-digit PIN code"),
  company: z.enum(["PSPCL", "PSTCL"]),
  dojCompany: pastDate,
  dojCompanyAs: text,
  dojCurrentPost: pastDate,
  dojCurrentPostAs: text,
  employeeId: text,
  contact: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile number"),
  email: z.email("Enter a valid email"),
  zone: text,
  circle: text,
  division: text,
  subDivision: text,
  qualification: z.enum(["ITI", "Diploma", "BE", "B.Tech", "M.Tech"]),
  discipline: z.enum(["Civil", "Electrical", "Mechanical"]),
  officeAddress: text,
  declarationAccepted: z.literal("on", "You must accept the declaration"),
});

export type RegisterState = {
  ok?: boolean;
  ref?: string;
  message?: string;
  errors?: Partial<Record<keyof z.infer<typeof schema> | "photo", string[]>>;
};

export async function register(_: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = schema.safeParse(raw);
  const photo = formData.get("photo");

  const photoError =
    !(photo instanceof File) || photo.size === 0
      ? "Passport-size photo is required"
      : !PHOTO_TYPES.includes(photo.type)
        ? "Use a JPG or PNG image"
        : photo.size > MAX_PHOTO
          ? "Photo must be under 500 KB"
          : null;

  if (!parsed.success || photoError) {
    const errors: RegisterState["errors"] = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;
    if (photoError) errors.photo = [photoError];
    return { errors, message: "Please fix the highlighted fields." };
  }

  const file = photo as File;
  let id: string;
  try {
    [{ id }] = await db
      .insert(applications)
      .values({
        ...parsed.data,
        declarationAccepted: true,
        photo: Buffer.from(await file.arrayBuffer()),
        photoType: file.type,
      })
      .returning({ id: applications.id });
  } catch (e) {
    // 23505 = unique_violation (employee_id)
    if ((e as { cause?: { code?: string } }).cause?.code === "23505" || (e as { code?: string }).code === "23505") {
      return { errors: { employeeId: ["An application with this Employee ID already exists"] } };
    }
    throw e;
  }

  const { name, email, contact } = parsed.data;
  after(() => notify("received", { id, name, email, contact })); // don't make the applicant wait on email/SMS
  return { ok: true, ref: refFor(id) };
}
