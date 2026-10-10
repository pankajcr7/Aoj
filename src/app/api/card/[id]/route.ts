import { getUser, STAFF } from "@/lib/auth";
import { memberCard } from "@/lib/member-card";

// Staff can print any member's card; a member only their own. Approved members only.
export async function GET(_req: Request, ctx: RouteContext<"/api/card/[id]">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user || (!STAFF.includes(user.role) && user.applicationId !== id)) return new Response("Not found", { status: 404 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const card = await memberCard(id);
  if (!card) return new Response("Not found", { status: 404 });
  return new Response(card.pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${card.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
