import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  check,
  date,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

// Membership numbers: AOJE-1001, AOJE-1002, ... (issued in order on approval)
export const membershipSeq = pgSequence("membership_seq", { startWith: 1001 });

export const role = pgEnum("role", ["admin", "operations", "member"]);
export const status = pgEnum("application_status", ["pending", "approved", "rejected", "suspended", "terminated"]);
export const company = pgEnum("company", ["PSPCL", "PSTCL"]);

// Mirrors the paper "Membership Form" field-for-field (numbers = form item no.).
export const applications = pgTable("applications", {
  id: uuid().primaryKey().defaultRandom(),
  status: status().notNull().default("pending"),

  name: text().notNull(), // 1
  fatherName: text().notNull(), // 2
  designation: text().notNull(), // 3
  dob: date().notNull(), // 4
  bloodGroup: text(), // Nullable for applications submitted before this field was added.
  address: text().notNull(), // 5
  correspondingAddress: text(), // Nullable for applications submitted before this field was added.
  pinCode: text().notNull(),
  company: company().notNull(),
  dojCompany: date().notNull(), // 6
  dojCompanyAs: text().notNull(),
  dojCurrentPost: date().notNull(), // 7
  dojCurrentPostAs: text().notNull(),
  employeeId: text().notNull().unique(), // 8
  contact: text().notNull(), // 9
  email: text().notNull(), // 10
  zone: text().notNull(), // 11
  circle: text().notNull(), // 12
  division: text().notNull(), // 13
  subDivision: text().notNull(), // 14
  qualification: text().notNull(), // 15
  discipline: text().notNull(),
  officeAddress: text().notNull(),
  declarationAccepted: boolean().notNull(),

  // Added with the new form layout (nullable: earlier applications don't have them)
  posting: text(),
  headquarters: text(),
  officeContact: text(),
  officialEmail: text(),
  membershipType: text(),
  pvcCardRequested: boolean().notNull().default(false),
  cardEmailRequested: boolean().notNull().default(false),
  pvcCardPayment: text(), // Payment preference only; not confirmation of payment.

  // ponytail: photo stored in Postgres (capped at 500 KB); move to object storage if volume grows
  photo: bytea().notNull(),
  photoType: text().notNull(),
  signature: bytea(),
  signatureType: text(),

  // "For office use only"
  membershipNo: text().unique(),
  reviewedBy: uuid(),
  reviewedAt: timestamp({ withTimezone: true }),
  rejectionReason: text(),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  loginId: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: role().notNull().default("member"),
  active: boolean().notNull().default(true),
  applicationId: uuid().references(() => applications.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Delivery log for email/SMS notifications (content is never stored, only the outcome).
export const notifyKind = pgEnum("notify_kind", ["received", "approved", "rejected", "password"]);
export const notifyChannel = pgEnum("notify_channel", ["email", "sms"]);
export const notifyStatus = pgEnum("notify_status", ["sent", "skipped", "failed"]);

export const notifications = pgTable("notifications", {
  id: uuid().primaryKey().defaultRandom(),
  applicationId: uuid()
    .notNull()
    .references(() => applications.id),
  kind: notifyKind().notNull(),
  channel: notifyChannel().notNull(),
  status: notifyStatus().notNull(),
  recipient: text().notNull(),
  error: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Corrections made by the Master ID (admin) after submission; shown as the audit trail.
export const applicationEdits = pgTable("application_edits", {
  id: uuid().primaryKey().defaultRandom(),
  applicationId: uuid()
    .notNull()
    .references(() => applications.id),
  field: text().notNull(),
  oldValue: text(),
  newValue: text(),
  remarks: text(),
  changedBy: uuid()
    .notNull()
    .references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// One reusable Razorpay order per charge; cancelled checkout retries cannot create duplicate charges.
export const payments = pgTable("payments", {
  id: uuid().primaryKey().defaultRandom(),
  applicationId: uuid().notNull().references(() => applications.id, { onDelete: "cascade" }),
  purpose: text().notNull(),
  amount: integer().notNull(), // INR paise, calculated on the server.
  membershipAmount: integer().notNull().default(0),
  pvcAmount: integer().notNull().default(0),
  status: text().notNull().default("pending"),
  razorpayOrderId: text().unique(),
  razorpayPaymentId: text().unique(),
  orderCreatingAt: timestamp({ withTimezone: true }),
  paidAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("payments_application_purpose_unique").on(table.applicationId, table.purpose),
  check("payments_purpose_check", sql`${table.purpose} in ('registration', 'pvc_card')`),
  check("payments_amount_check", sql`${table.amount} > 0`),
  check("payments_membership_amount_check", sql`${table.membershipAmount} >= 0`),
  check("payments_pvc_amount_check", sql`${table.pvcAmount} in (0, 20000)`),
  check("payments_status_check", sql`${table.status} in ('pending','created','authorized','paid','failed','refunded','partially_refunded')`),
  check("payments_amount_sum", sql`${table.amount} = ${table.membershipAmount} + ${table.pvcAmount}`),
]);
