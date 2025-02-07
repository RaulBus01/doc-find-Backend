import { eq } from "drizzle-orm";
import { db } from "../../database/database.ts";
import { chats, insertChatSchema } from "../../drizzle/schema.ts";
import { CreateChat } from "../../routes/chat/chat.route.ts";
import { z } from "@hono/zod-openapi";

export class ChatService {
  async createChat(chat: z.infer<typeof insertChatSchema>) {
    const newChat = await db.insert(chats)
      .values(chat)
      .returning();
    return newChat[0];
  }

  async getChats(userId: string) {
    return await db.select()
      .from(chats)
      .where(eq(chats.userId, userId));
  }
}

export const chatService = new ChatService();