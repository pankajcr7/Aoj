// Field rules shared by the signup form and Master ID corrections.
import { z } from "zod";
import { DESIGNATIONS, DISCIPLINES, LEGACY_MEMBERSHIP_TYPES, MEMBERSHIP_TYPES, QUALIFICATIONS } from "./form-options";

export const MAX_IMAGE = 500 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png"]; // what the PDF card can embed; the form converts other formats

export const imageError = (f: File) =>
  !IMAGE_TYPES.includes(f.type) ? "Use a JPG or PNG image" : f.size > MAX_IMAGE ? "Image must be under 500 KB" : null;

/** The uploaded file under `name`, or null when none was chosen. */
export const fileOf = (formData: FormData, name: string) => {
  const f = formData.get(name);
  return f instanceof File && f.size > 0 ? f : null;
};

/** All string entries (files dropped). */
export const stringsOf = (formData: FormData) =>
  Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")) as Record<string, string>;

const text = z.string().trim().min(1, "Required").max(300);
const optional = z.string().trim().max(300).optional().transform((v) => v || null);
const pastDate = z.iso.date("Enter a valid date").refine((d) => new Date(d) <= new Date(), "Cannot be in the future");

export const applicationSchema = z.object({
  name: text,
  fatherName: text,
  designation: z.enum(DESIGNATIONS, "Select designation"),
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
  qualification: z.enum(QUALIFICATIONS),
  discipline: z.enum(DISCIPLINES),
  officeAddress: text,
  posting: text,
  headquarters: text,
  officeContact: optional,
  officialEmail: z.union([z.literal(""), z.email("Enter a valid email")]).optional().transform((v) => v || null),
  membershipType: z
    .union([z.literal(""), z.enum([...MEMBERSHIP_TYPES, ...LEGACY_MEMBERSHIP_TYPES])])
    .optional()
    .transform((v) => v || null),
});

export type ApplicationField = keyof z.infer<typeof applicationSchema>;

// Shown in the audit trail.
export const FIELD_LABELS: Record<ApplicationField | "photo" | "signature", string> = {
  name: "Full Name",
  fatherName: "Father's Name",
  designation: "Designation",
  dob: "Date of Birth",
  address: "Residential Address",
  pinCode: "Pin Code",
  company: "Organisation",
  dojCompany: "Date of Joining PSPCL/PSTCL",
  dojCompanyAs: "Joined As",
  dojCurrentPost: "Date of Joining Current Post",
  dojCurrentPostAs: "Current Post",
  employeeId: "Employee ID No.",
  contact: "Mobile Number",
  email: "Email Address",
  zone: "Nearby or Posting Zone",
  circle: "Nearby or Posting Circle",
  division: "Division / Office",
  subDivision: "Sub Division / Office",
  qualification: "Technical Qualification",
  discipline: "Discipline",
  officeAddress: "Office Address",
  posting: "Posting / Office",
  headquarters: "Headquarters",
  officeContact: "Contact No. (Office)",
  officialEmail: "Email (Official)",
  membershipType: "Membership Type",
  photo: "Passport Photo",
  signature: "Signature",
};
