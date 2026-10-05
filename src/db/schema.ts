import {
  boolean,
  customType,
  date,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

// Membership numbers: AOJE-0001, AOJE-0002, ... (issued in order on approval)
export const membershipSeq = pgSequence("membership_seq", { startWith: 1 });

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
  address: text().notNull(), // 5
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
