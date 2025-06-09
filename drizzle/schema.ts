// schema.ts

// deno --env -A --node-modules-dir npm:drizzle-kit push   
import { pgTable, serial, text, timestamp, varchar, integer,boolean, jsonb, uniqueIndex, index, unique} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod"




export const chats = pgTable("chats", {
  id: serial("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
},
(table) => [
  index("user_id_index").on(table.userId),
  uniqueIndex("chats_pkey2").on(table.id),
]);




export const selectChatSchema= createSelectSchema(chats);
export const insertChatSchema= createInsertSchema(chats).required({
  userId: true,
  title: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});










