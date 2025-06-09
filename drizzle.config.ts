import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./drizzle",
  schema: "./drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: Deno.env.get("DB_URL")!,
  },
  tablesFilter:['chats',]

});