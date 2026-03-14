import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
    // Vercel (Debian/Ubuntu) 上的系统 CA 证书路径
    ssl: {
      ca: "/etc/ssl/certs/ca-certificates.crt",
    },
  },
});
