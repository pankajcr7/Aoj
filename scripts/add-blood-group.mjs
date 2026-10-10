// Add the blood-group field without changing earlier applications.
import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
setDefaultAutoSelectFamilyAttemptTimeout(1000);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS blood_group text`;
const [column] = await sql`SELECT data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'blood_group'`;
if (column?.data_type !== "text" || column.is_nullable !== "YES") throw new Error("Blood group column must be nullable text");
console.log("Blood-group column is ready; earlier applications retain a blank value.");