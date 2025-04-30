// schema.ts

// deno --env -A --node-modules-dir npm:drizzle-kit push   
import { pgTable, serial, text, timestamp, varchar, integer,boolean, jsonb} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  oauthProvider: text("oauth_provider"),
  oauthId: text("oauth_id").unique().notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  givenName: varchar("given_name", { length: 100 }),
  familyName: varchar("family_name", { length: 100 }),
  picture: text("picture"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const messagesHistory = pgTable("messages_history", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});


export const selectMessagesHistorySchema = createSelectSchema(messagesHistory);
export const insertMessagesHistorySchema = createInsertSchema(messagesHistory).required({
  sessionId: true,
  message: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectChatSchema= createSelectSchema(chats);
export const insertChatSchema= createInsertSchema(chats).required({
  userId: true,
  title: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const usersSchema= createSelectSchema(users);
export const insertUserSchema= createInsertSchema(users).required({
  oauthProvider: true,
  oauthId: true,
  username: true,
  email: true,
  emailVerified: true,
  givenName: true,
  familyName: true,
  picture: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema= createSelectSchema(users).required({
  id: true,
  username: true,
  email: true,
  emailVerified: true,
  givenName: true,
  familyName: true,
  picture: true,
  createdAt: true,
}).omit({
  oauthProvider: true,
  oauthId: true,
  updatedAt: true,
});




