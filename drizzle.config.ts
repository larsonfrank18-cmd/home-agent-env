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
    // 在本地 Windows 环境下，必须使用绝对路径指向 CA 证书
    ssl: {
      ca: "C:/Users/jylib/Documents/trae_projects/trae/project_code/certs/isrg-root-x1.pem",
    },
  },
});
