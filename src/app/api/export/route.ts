import { and, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { searchFilter } from "@/app/dashboard/queries";
import { getUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

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
      company: a.company, employeeId: a.employeeId, dojCompany: a.dojCompany, dojCompanyAs: a.dojCompanyAs, dojCurrentPost: a.dojCurrentPost,
      dojCurrentPostAs: a.dojCurrentPostAs, contact: a.contact, email: a.email, address: a.address, pinCode: a.pinCode, zone: a.zone,
      circle: a.circle, division: a.division, subDivision: a.subDivision, officeAddress: a.officeAddress, qualification: a.qualification,
      discipline: a.discipline, submitted: a.createdAt, reviewed: a.reviewedAt, rejectionReason: a.rejectionReason,
    })
    .from(a)
    .where(and(statusFilter ? eq(a.status, statusFilter) : undefined, searchFilter(q)))
    .orderBy(desc(a.createdAt));

  const header = [
    "Membership No", "Status", "Name", "Father's Name", "Date of Birth", "Designation", "Organisation", "Employee ID",
    "Joined Service", "Joined As", "Current Post Since", "Current Post", "Mobile", "Email", "Address", "Pin Code", "Zone",
    "Circle", "Division", "Sub Division", "Office Address", "Qualification", "Discipline", "Submitted", "Reviewed", "Rejection Reason",
  ];
  const csv = toCsv(header, rows.map((r) => Object.values(r)));
  const file = `aoj-${statusFilter ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" },
  });
}
