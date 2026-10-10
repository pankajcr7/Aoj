import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { membershipCardPdf } from "@/lib/card-pdf";

/** The membership card PDF for an approved member, or null if not approved. Used by the download route and the approval email. */
export async function memberCard(id: string): Promise<{ pdf: Uint8Array; filename: string } | null> {
  const a = applications;
  const [m] = await db
    .select({
      name: a.name, fatherName: a.fatherName, designation: a.designation, company: a.company, employeeId: a.employeeId,
      address: a.address, division: a.division, subDivision: a.subDivision,
      membershipNo: a.membershipNo, posting: a.posting, circle: a.circle, zone: a.zone, contact: a.contact, bloodGroup: a.bloodGroup,
      photo: a.photo, photoType: a.photoType, signature: a.signature, signatureType: a.signatureType,
    })
    .from(a)
    .where(and(eq(a.id, id), eq(a.status, "approved")));
  if (!m?.membershipNo) return null;

  const pdf = await membershipCardPdf({
    ...m,
    membershipNo: m.membershipNo,
    photo: new Uint8Array(m.photo),
    signature: m.signature && new Uint8Array(m.signature),
    logo: await readFile(join(process.cwd(), "public/logo.jpeg")),
    authoritySign: await readFile(join(process.cwd(), "public/General-Secretary-Sign.png")).catch(() => null),
  });
  return { pdf, filename: `${m.membershipNo}-membership-card.pdf` };
}
