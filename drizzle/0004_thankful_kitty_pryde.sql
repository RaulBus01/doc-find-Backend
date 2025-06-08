ALTER TABLE "chats" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "id" SET DEFAULT nextval('chats_id_seq');