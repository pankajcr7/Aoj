import { and, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { alias } from "drizzle-orm/pg-core";
import { applications, payments } from "@/db/schema";
import { searchFilter } from "@/app/dashboard/queries";
import { getUser } from "@/lib/auth";
import { CARD_PAYMENT_LABELS } from "@/lib/form-options";
import { toCsv } from "@/lib/csv";

const cardCharge = alias(payments, "card_charge");
const STATUSES = ["pending", "approved", "rejected"] as const;

// Admin only: download applications (no photos) as CSV that opens cleanly in Excel.
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (user?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? "approved";
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const statusFilter = STATUSES.find((s) => s === status);

  const a = applications;
  const rows = await db
    .select({
      membershipNo: a.membershipNo, status: a.status, name: a.name, fatherName: a.fatherName, dob: a.dob, designation: a.designation,
      company: a.company, employeeId: a.employeeId, membershipType: a.membershipType, posting: a.posting, headquarters: a.headquarters,
      officeContact: a.officeContact, officialEmail: a.officialEmail, dojCompany: a.dojCompany, dojCompanyAs: a.dojCompanyAs, dojCurrentPost: a.dojCurrentPost,
      dojCurrentPostAs: a.dojCurrentPostAs, contact: a.contact, email: a.email, address: a.address, correspondingAddress: a.correspondingAddress, pinCode: a.pinCode, zone: a.zone,
      circle: a.circle, division: a.division, subDivision: a.subDivision, officeAddress: a.officeAddress, qualification: a.qualification,
      discipline: a.discipline, submitted: a.createdAt, reviewed: a.reviewedAt, rejectionReason: a.rejectionReason, pvcCardRequested: a.pvcCardRequested, bloodGroup: a.bloodGroup, cardEmailRequested: a.cardEmailRequested, pvcCardPayment: a.pvcCardPayment,
      registrationPaymentStatus: payments.status, registrationPaymentAmount: payments.amount, registrationPaymentId: payments.razorpayPaymentId,
      pvcPaymentStatus: cardCharge.status, pvcPaymentAmount: cardCharge.amount, pvcPaymentId: cardCharge.razorpayPaymentId,
    })
    .from(a)
    .leftJoin(payments, and(eq(payments.applicationId, a.id), eq(payments.purpose, "registration")))
    .leftJoin(cardCharge, and(eq(cardCharge.applicationId, a.id), eq(cardCharge.purpose, "pvc_card")))
    .where(and(statusFilter ? eq(a.status, statusFilter) : undefined, searchFilter(q)))
    .orderBy(desc(a.createdAt));

  const header = [
    "Membership No", "Status", "Name", "Father's Name", "Date of Birth", "Designation", "Organisation", "Employee ID",
    "Membership Type", "Posting", "Headquarters", "Office Contact", "Official Email",
    "Joined Service", "Joined As", "Current Post Since", "Current Post", "Mobile", "Email", "Address", "Corresponding Address", "Pin Code", "Zone",
    "Circle", "Division", "Sub Division", "Office Address", "Qualification", "Discipline", "Submitted", "Reviewed", "Rejection Reason", "PVC Card Requested", "Blood Group", "Card by Email", "PVC Card Payment Preference", "Registration Payment Status", "Registration Amount (INR)", "Registration Razorpay ID", "Later PVC Payment Status", "Later PVC Amount (INR)", "Later PVC Razorpay ID",
  ];
  const csv = toCsv(header, rows.map((r) => Object.values({ ...r, registrationPaymentAmount: r.registrationPaymentAmount == null ? null : r.registrationPaymentAmount / 100, pvcPaymentAmount: r.pvcPaymentAmount == null ? null : r.pvcPaymentAmount / 100, pvcCardRequested: r.pvcCardRequested ? "Yes" : "No", cardEmailRequested: r.cardEmailRequested ? "Yes" : "No", pvcCardPayment: r.pvcCardPayment === "pay_now" || r.pvcCardPayment === "pay_later" ? CARD_PAYMENT_LABELS[r.pvcCardPayment] : r.pvcCardPayment })));
  const file = `aoj-${statusFilter ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" },
  });
}
