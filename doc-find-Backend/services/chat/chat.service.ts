import { eq } from "drizzle-orm";
import { db } from "../../database/database.ts";
import { chats, insertChatSchema, messages } from "../../drizzle/schema.ts";
import { z } from "@hono/zod-openapi";
import { ChatNotFoundException } from "../exceptions/ChatNotFoundException.ts";

export class ChatService {
  // Create a new chat in the database
  async createChat(chat: z.infer<typeof insertChatSchema>) {
    chat.title = "Chat with 1";
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }


  // Get all chats for a given userId
  async getChats(userId: number) {
    const chatsData =  await db.select().from(chats).where(eq(chats.userId, userId));
    if(chatsData.length === 0) {
        throw new ChatNotFoundException("Chats not found for user id " + userId);
    }
    return chatsData;
  }
  // Get a chat by id
  async getChat(id: number, userId: number) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if(chat.length === 0) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if(chat[0].userId !== userId) {
        throw new Error("User not authorized to view this chat");
    }
    return chat[0];
  }
  async addMessage(id: number,  userId: number,message: string,) {

    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    if(chat === undefined) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }


    if(chat.userId !== userId) {
        throw new Error("User not authorized to add message to this chat");
    }

        
    return await db.insert(messages).values({chatId: id, content: message, userId: chat.userId}).returning();
    
  }
  async createChatWithMessage(chat: z.infer<typeof insertChatSchema>, message: string) {
    const chatTransaction = await db.transaction(async (db) =>{
      //Desctructure the chat returned from the insert
      const [newChat] = await db.insert(chats).values(chat).returning();
      //Check if the chat was created
      if (!newChat) {
        throw new Error("Chat not created");
      }
      //Desctructure the message returned from the insert
      const [createdMessage] = await db.insert(messages).values({chatId: newChat.id, content: message, userId: newChat.userId}).returning();
      //Check if the message was created
      if(!createdMessage) {
        throw new Error("Message not created");
      }
      
      return newChat;
    });
    //Return the chat transaction
    return chatTransaction;
  }


  // Get all messages for a given chat id
  async getChatMessages(id: number, userId: number) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if(chat.length === 0) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if(chat[0].userId !== userId) {
        throw new Error("User not authorized to view messages for this chat id");
    }
          
    return await db.select().from(messages).where(eq(messages.chatId, id));
  }

  // Delete a chat by id
  async deleteChat(id: number, userId: number) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if(chat.length === 0) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if(chat[0].userId !== userId) {
        throw new Error("User not authorized to delete this chat");
    }
    const messagesDeleted = await db.delete(messages).where(eq(messages.chatId, id)).returning();
    if(messagesDeleted.length === 0) {
        throw new Error("Messages not deleted");
    }
    return await db.delete(chats).where(eq(chats.id, id)).returning();
  }
   
   
}

export const chatService = new ChatService();
