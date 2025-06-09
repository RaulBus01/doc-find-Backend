DROP INDEX "chats_pkey";--> statement-breakpoint
CREATE UNIQUE INDEX "chats_pkey2" ON "chats" USING btree ("id");