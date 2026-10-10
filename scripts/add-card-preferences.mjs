// Add card delivery/payment preferences; existing applications remain unchanged.
import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
setDefaultAutoSelectFamilyAttemptTimeout(1000);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS card_email_requested boolean NOT NULL DEFAULT false`,
  sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS pvc_card_payment text`,
]);
const columns = await sql`
  SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'applications'
  AND column_name IN ('card_email_requested', 'pvc_card_payment')
`;
const email = columns.find(c => c.column_name === 'card_email_requested');
const payment = columns.find(c => c.column_name === 'pvc_card_payment');
if (email?.data_type !== 'boolean' || email.is_nullable !== 'NO' || email.column_default !== 'false' || payment?.data_type !== 'text' || payment.is_nullable !== 'YES') throw new Error('Unexpected card preference schema');
console.log('Card delivery and payment preference columns verified. Existing records preserved.');