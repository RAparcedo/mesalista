import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The CLI (migrations) needs a direct connection to the database.
    // The app itself connects through the pooled URL — see src/db/prisma.ts.
    url: process.env.DIRECT_URL,
  },
});
