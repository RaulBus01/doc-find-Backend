import { asc, desc, eq } from "drizzle-orm";
import { checkpointer, db } from "../../database/database.ts";
import { chats, insertChatSchema, messagesHistory } from "../../drizzle/schema.ts";
import { z } from "npm:@hono/zod-openapi";
import { ChatNotFoundException } from "../exceptions/ChatNotFoundException.ts";
import { generateTitleWithGemini } from "../ai-service.ts";
import { Checkpoint } from "@langchain/core";
import { BaseMessage, isAIMessage } from "@langchain/core/messages";
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
  
  async createChatWithMessage(chat: z.infer<typeof insertChatSchema>, message: string) {
    const chatTransaction = await db.transaction(async (db) =>{
      //Desctructure the chat returned from the insert
      const [newChat] = await db.insert(chats).values(chat).returning();
      //Check if the chat was created
      if (!newChat) {
        throw new Error("Chat not created");
      }
      // //Desctructure the message returned from the insert
      // const [createdMessage] = await db.insert(messages).values({chatId: newChat.id, content: message, userId: newChat.userId}).returning();
      // //Check if the message was created
      // if(!createdMessage) {
      //   throw new Error("Message not created");
      // }
      
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
    const checkpoint = await checkpointer.get({
      configurable: {
        thread_id: chatId.toString(),
      }
     });
    if (!checkpoint) {
      throw new ChatNotFoundException("Checkpoint not found for chat id " + chatId);
    }
   
    
    // Extract the conversation for context (limit to first few messages)
    const chatMessages = extractMessagesFromCheckpoint(checkpoint, chatId.toString(), 2);
    const chatContent = chatMessages.map((message) => message.content).join("\n");
      
    // Generate title prompt
    const titlePrompt = `Create a concise, descriptive title (maximum 5 words) for this conversation. If the conversation lacks a clear specific topic, generate the default title "General Discussion".
    Conversation:${chatContent}`;
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

   const checkpoint = await checkpointer.get({
    configurable: {
      thread_id: id.toString(),
    }
   });
    if(checkpoint) {
      return extractMessagesFromCheckpoint(checkpoint,id.toString());
    }
    else {
      console.warn("No checkpoint found for chat id " + id);
    }

  }

  async getChatLastMessages (chatId: number,userId: number,messagesNumber:number) {
    const chat = await db.select().from(chats).where(eq(chats.id, chatId));
    if(chat.length === 0) {
        throw new ChatNotFoundException("Chat with id " + chatId + " not found");
    }
    if(chat[0].userId !== userId) {
      throw new Error("User not authorized to view messages for this chat id");
  }
  const checkpoint = await checkpointer.get({
    configurable: {
      thread_id: chatId.toString(),
    }
   });
    if(checkpoint) {
      return extractMessagesFromCheckpoint(checkpoint,chatId.toString(),messagesNumber);
    }
    else {
      console.warn("No checkpoint found for chat id " + chatId);
    }

  

  
 

  
    // const lastTwoChats = db.$with("lastTwoChats").as(
    //   db.select()
    //     .from(messagesHistory)
    //     .where(eq(messagesHistory.sessionId, chatId.toString()))
    //     .orderBy(desc(messagesHistory.updatedAt))
    //     .limit(2)
    // );
    // const results = await db.with(lastTwoChats).select().from(lastTwoChats).orderBy(asc(lastTwoChats.createdAt));

    // return results;
    
    

  
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
    const messagesDeleted = await db.delete(messagesHistory).where(eq(messagesHistory.sessionId, id.toString())).returning();
    if(messagesDeleted.length === 0) {
        throw new Error("Messages not deleted");
    }
    return await db.delete(chats).where(eq(chats.id, id)).returning();
  }
  
   
   
}



export const chatService = new ChatService();

function extractMessagesFromCheckpoint(checkpoint: Checkpoint<string, string>,sessionId?: string,limit?: number): { id: string; chatId: string; isAI: boolean; content: string }[] {
  try {
   
    if (!checkpoint?.channel_values?.messages) {
      console.warn("No messages found in checkpoint");
      return [];
    }
    let messages;

    if(limit && limit > 0) {
      messages = checkpoint.channel_values.messages.slice(-2);
    } 
    else{
      messages = checkpoint.channel_values.messages;
    }
   
    const extractedMessages = messages.map((message: BaseMessage) => {
 
      return {
        id: message.id,
        chatId: sessionId,
        isAI: isAIMessage(message),
        content: message.content,
      
      };
    });
   

    return extractedMessages;
   

    
  
  } catch (error) {
    console.error("Error extracting messages from checkpoint:", error);
    return [];
  }
}
