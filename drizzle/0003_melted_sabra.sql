CREATE INDEX "user_id_index" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chats_pkey" ON "chats" USING btree ("id");