import { eq } from "drizzle-orm";
import { db } from "../../database/database.ts";
import { chats, insertChatSchema } from "../../drizzle/schema.ts";
import { z } from "@hono/zod-openapi";
import { ChatNotFoundException } from "../exceptions/ChatNotFoundException.ts";

export class ChatService {
  async createChat(chat: z.infer<typeof insertChatSchema>) {
    const newChat = await db.insert(chats).values(chat).returning();
    return newChat[0];
  }

  async getChats(userId: number) {
    return await db.select().from(chats).where(eq(chats.userId, userId));
  }

  async getChat(id: number) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));

    if(chat.length === 0) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    return chat[0];
  }
  
  async deleteChat(id: number) {

    const result =  await db.delete(chats).where(eq(chats.id, id)).returning();
    if (result.length === 0) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    
    return result[0];
  }
   
   
}

export const chatService = new ChatService();
