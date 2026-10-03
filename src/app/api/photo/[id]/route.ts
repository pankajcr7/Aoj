import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { getUser, STAFF } from "@/lib/auth";

// Staff can see any photo; a member only their own.
export async function GET(req: Request, ctx: RouteContext<"/api/photo/[id]">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user || (!STAFF.includes(user.role) && user.applicationId !== id)) return new Response("Not found", { status: 404 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  // ?signature serves the member's uploaded signature instead of the photo.
  const sig = new URL(req.url).searchParams.has("signature");
  const [row] = await db
    .select(sig ? { photo: applications.signature, type: applications.signatureType } : { photo: applications.photo, type: applications.photoType })
    .from(applications)
    .where(eq(applications.id, id));
  if (!row?.photo || !row.type) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.photo), {
    headers: { "Content-Type": row.type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
