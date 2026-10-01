import "server-only";
import { ilike, or, type SQL } from "drizzle-orm";
import { applications } from "@/db/schema";

/** Case-insensitive search across the fields staff usually know. */
export function searchFilter(q: string): SQL | undefined {
  if (!q) return undefined;
  const like = `%${q.replace(/[\%_]/g, "\$&")}%`;
  return or(
    ilike(applications.name, like),
    ilike(applications.employeeId, like),
    ilike(applications.contact, like),
    ilike(applications.membershipNo, like),
    ilike(applications.circle, like),
  );
}
