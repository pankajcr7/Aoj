// Adds the optional PVC card choice without changing existing application data.
import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
setDefaultAutoSelectFamilyAttemptTimeout(1000);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS pvc_card_requested boolean NOT NULL DEFAULT false`;
const [column] = await sql`
  SELECT data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'pvc_card_requested'
`;
if (column?.data_type !== "boolean" || column.is_nullable !== "NO" || column.column_default !== "false") {
  throw new Error("PVC card column does not match the required boolean/default schema");
}
console.log("PVC card request column is ready; existing applications default to not requested.");