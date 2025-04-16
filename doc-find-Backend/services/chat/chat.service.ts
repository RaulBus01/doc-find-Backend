import { desc, eq } from "drizzle-orm";
import { db } from "../../database/database.ts";
import { chats, insertChatSchema, messages } from "../../drizzle/schema.ts";
import { z } from "@hono/zod-openapi";
import { ChatNotFoundException } from "../exceptions/ChatNotFoundException.ts";
import { generateTitleWithGemini } from "../LLM.ts";

export class ChatService {
  // Create a new chat in the database
  async createChat(chat: z.infer<typeof insertChatSchema>) {
    chat.title = "Chat with 1";
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }


  // Get all chats for a given userId
  async getChats(userId: number,limit?:string) {
    const query = db.select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));

  if (limit) {
    query.limit(parseInt(limit));
  }

  const chatsData = await query;
  
  if (chatsData.length === 0) {
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
  async addMessage(id: number,  userId: number,message: string,isAI: boolean) {

   const chatTransaction = await db.transaction(async(db) => {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    if (!chat) {
      throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if(chat.userId !== userId) {
        throw new Error("User not authorized to add message to this chat");

    }

    const [newMessage] = await db.insert(messages).values({chatId: id, content: message, userId: userId,isAI:isAI}).returning();
    
    const [updatedChat] = await db.update(chats).set({updatedAt: new Date().toISOString()}).where(eq(chats.id, id)).returning();
    if(!newMessage || !updatedChat) {
      throw new Error("Message not added to chat");
    }
    return newMessage;
  });
  return chatTransaction;
    
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
  // Update a chat title by id
  async updateChatTitle(id: number, userId: number, title: string) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if(chat.length === 0) {
        throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if(chat[0].userId !== userId) {
        throw new Error("User not authorized to update this chat");
    }
    
    const [updatedChat] = await db.update(chats)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(eq(chats.id, id))
      .returning();
      
    if(!updatedChat) {
      throw new Error("Chat title not updated");
    }
    
    return updatedChat;
  }
  async generateAndUpdateTitle(chatId: number, userId: number) {
    // Get the first few messages to generate a meaningful title
    const chatMessages = await this.getChatMessages(chatId, userId);
    if (chatMessages.length === 0) {
      throw new Error("No messages found to generate title");
    }
    
    // Extract the conversation for context (limit to first few messages)
    const conversationLimit = Math.min(chatMessages.length, 3);
    const conversation = chatMessages
      .slice(0, conversationLimit)
      .map(msg => msg.content)
      .join("\n");
      
    // Generate title prompt
    const titlePrompt = `Create a concise, descriptive title (maximum 5 words) for this conversation. If the conversation lacks a clear specific topic, generate the default title "General Discussion".
    Conversation:${conversation}`;
    try {
      // Import the Gemini title generator
      
      const title = await generateTitleWithGemini(titlePrompt);
      
      // Update the chat with the new title
      return await this.updateChatTitle(chatId, userId, title);
    } catch (error) {
      console.error("Failed to generate title:", error);
      throw error;
    }
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
