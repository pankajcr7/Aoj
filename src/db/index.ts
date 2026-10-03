import "server-only";
import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Node gives each IP only 250 ms before trying the next. With broken IPv6 and ~280 ms to us-east-1,
// every attempt gets cut off ("fetch failed"). Allow 1 s per address.
setDefaultAutoSelectFamilyAttemptTimeout(1000);

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema, casing: "snake_case" });
