// Create a staff account: npm run user:create -- <loginId> <password> <admin|operations>
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const [rawId, password, role = "admin"] = process.argv.slice(2);
const loginId = rawId?.toLowerCase();
if (!loginId || !password || !["admin", "operations"].includes(role)) {
  console.error("Usage: npm run user:create -- <loginId> <password> <admin|operations>");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await sql`insert into users (login_id, password_hash, role) values (${loginId}, ${await bcrypt.hash(password, 12)}, ${role})`;
console.log(`Created ${role} "${loginId}"`);
