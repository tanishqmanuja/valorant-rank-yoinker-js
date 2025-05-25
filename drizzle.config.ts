import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: 'turso',
  dbCredentials: {
    url: "file:./vryjs.db",
  },
  schema: "./src/db/schema.ts",
});