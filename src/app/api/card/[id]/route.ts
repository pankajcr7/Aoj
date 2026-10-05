import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { getUser, STAFF } from "@/lib/auth";
import { membershipCardPdf } from "@/lib/card-pdf";
import { fmtDate } from "@/lib/format";

// Staff can print any member's card; a member only their own. Approved members only.
export async function GET(_req: Request, ctx: RouteContext<"/api/card/[id]">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user || (!STAFF.includes(user.role) && user.applicationId !== id)) return new Response("Not found", { status: 404 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const a = applications;
  const [m] = await db
    .select({
      name: a.name, fatherName: a.fatherName, designation: a.designation, company: a.company, employeeId: a.employeeId,
      membershipNo: a.membershipNo, reviewedAt: a.reviewedAt, circle: a.circle, zone: a.zone, contact: a.contact,
      photo: a.photo, photoType: a.photoType, signature: a.signature, signatureType: a.signatureType,
    })
    .from(a)
    .where(and(eq(a.id, id), eq(a.status, "approved")));
  if (!m?.membershipNo) return new Response("Not found", { status: 404 });

  const pdf = await membershipCardPdf({
    ...m,
    membershipNo: m.membershipNo,
    memberSince: fmtDate(m.reviewedAt),
    photo: new Uint8Array(m.photo),
    signature: m.signature && new Uint8Array(m.signature),
    logo: await readFile(join(process.cwd(), "public/logo.jpeg")),
    authoritySign: await readFile(join(process.cwd(), "public/General-Secretary-Sign.png")).catch(() => null),
  });
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${m.membershipNo}-membership-card.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
