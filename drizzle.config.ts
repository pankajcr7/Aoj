import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import { defineConfig } from "drizzle-kit";

process.loadEnvFile(".env");
setDefaultAutoSelectFamilyAttemptTimeout(1000); // see src/db/index.ts

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
