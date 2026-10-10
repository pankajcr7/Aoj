import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
setDefaultAutoSelectFamilyAttemptTimeout(1000);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('registration','pvc_card')),
  amount integer NOT NULL CHECK (amount > 0), membership_amount integer NOT NULL DEFAULT 0 CHECK (membership_amount >= 0),
  pvc_amount integer NOT NULL DEFAULT 0 CHECK (pvc_amount IN (0,20000)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','created','authorized','paid','failed','refunded','partially_refunded')),
  razorpay_order_id text UNIQUE, razorpay_payment_id text UNIQUE,
  order_creating_at timestamptz, paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_amount_sum CHECK (amount = membership_amount + pvc_amount),
  CONSTRAINT payments_application_purpose_unique UNIQUE (application_id,purpose)
)`;
const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='payments'`;
if (columns.length !== 13) throw new Error('Unexpected payments schema');
console.log('Razorpay payment ledger ready. Existing applications are unchanged.');
