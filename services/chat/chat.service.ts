import { eq, sql } from "drizzle-orm";
import { checkpointer, db } from "../../database/database.ts";
import { chats, insertChatSchema } from "../../drizzle/schema.ts";
import { z } from "npm:@hono/zod-openapi";
import { ChatNotFoundException } from "../exceptions/ChatNotFoundException.ts";
import { generateTitleWithGemini } from "../ai-service.ts";

import { BaseMessage, isAIMessage, filterMessages, HumanMessage, AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { Checkpoint } from "@langchain/langgraph";

const MESSAGE_LIMIT = 2;



export class ChatService {
 
  async createChatWithMessage(chat: z.infer<typeof insertChatSchema>) {
    const chatTransaction = await db.transaction(async (db) => {

      const [newChat] = await db.insert(chats).values(chat).returning();
    
      if (!newChat) {
        throw new Error("Chat not created");
      }


      return newChat;
    });

    return chatTransaction;
  }
  // Update a chat title by id
  async updateChatTitle(id: number, userId: string, title: string) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if (chat.length === 0) {
      throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if (chat[0].userId !== userId) {
      throw new Error("User not authorized to update this chat");
    }

    const [updatedChat] = await db.update(chats)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(eq(chats.id, id))
      .returning();

    if (!updatedChat) {
      throw new Error("Chat title not updated");
    }

    return updatedChat;
  }
  async generateAndUpdateTitle(chatId: number, userId: string) {
  
    const checkpoint = await checkpointer.get({
      configurable: {
        thread_id: chatId.toString(),
      }
    });
    if (!checkpoint) {
      throw new ChatNotFoundException("Checkpoint not found for chat id " + chatId);
    }



    const chatMessages = extractMessagesFromCheckpoint(checkpoint, chatId.toString(), MESSAGE_LIMIT);
    const chatContent = chatMessages.map((message) => message.content).join("\n");

   
    const titlePrompt = `Create a concise, descriptive title (maximum 5 words) for this conversation. If the conversation lacks a clear specific topic, generate the default title "General Discussion. Don't generate Markdown text !!!".
    Conversation:`;
    try {


      const title = await generateTitleWithGemini(titlePrompt, chatContent);

      return await this.updateChatTitle(chatId, userId, title.toString());
    } catch (error) {
      console.error("Failed to generate title:", error);
      throw error;
    }
  }

 async getChatMessages(id: number, userId: string) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if (chat.length === 0) {
      throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if (chat[0].userId !== userId) {
      throw new Error("User not authorized to view messages for this chat id");
    }
    
    const checkpoint = await checkpointer.get({
      configurable: {
        thread_id: id.toString(),
      }
    });
    if (checkpoint) {
      return extractMessagesFromCheckpoint(checkpoint, id.toString());
    }
    else {
      console.warn("No checkpoint found for chat id " + id);
    }

  }


  async getChatLastMessages(chatId: number, userId: string) {
    const chat = await db.select().from(chats).where(eq(chats.id, chatId));
    if (chat.length === 0) {
      throw new ChatNotFoundException("Chat with id " + chatId + " not found");
    }
    if (chat[0].userId !== userId) {
      throw new Error("User not authorized to view messages for this chat id");
    }
    const checkpoint = await checkpointer.get({
      configurable: {
        thread_id: chatId.toString(),
      }
    });
    if (checkpoint) {
      return extractMessagesFromCheckpoint(checkpoint, chatId.toString());
    }
    else {
      console.warn("No checkpoint found for chat id " + chatId);
    }









  }
  // Delete a chat by id
  async deleteChat(id: number, userId: string) {
    const chat = await db.select().from(chats).where(eq(chats.id, id));
    if (chat.length === 0) {
      throw new ChatNotFoundException("Chat with id " + id + " not found");
    }
    if (chat[0].userId !== userId) {
      throw new Error("User not authorized to delete this chat");
    }

    try {

      const threadId = id.toString();

      // Delete all checkpoint data from PostgreSQL tables using SQL
      await db.execute(sql`DELETE FROM checkpoint_blobs WHERE thread_id = ${threadId}`);
      await db.execute(sql`DELETE FROM checkpoint_writes WHERE thread_id = ${threadId}`);
      await db.execute(sql`DELETE FROM checkpoints WHERE thread_id = ${threadId}`);

      // Finally delete the chat itself
      await db.delete(chats).where(eq(chats.id, id));
  

      return { success: true, message: `Chat ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting chat ${id}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete chat: ${error.message}`);
      } else {
        throw new Error(`Failed to delete chat: An unknown error occurred`);
      }
    }
  }
   
}



export const chatService = new ChatService();

function extractMessagesFromCheckpoint(checkpoint: Checkpoint<string, string>, sessionId?: string,limit?:number): { id: string; chatId: string; isAI: boolean; content: string }[] {
  try {
    if (!checkpoint?.channel_values?.messages) {
      console.warn("No messages found in checkpoint");
      return [];
    }

    //  Filter by message type first
    const messagesCheck = checkpoint.channel_values.messages;
    if (!Array.isArray(messagesCheck)) {
      console.warn("Messages is not an array");
      return [];
    }
    
    const messagesArray = filterMessages(messagesCheck, {
      includeTypes: [HumanMessage, AIMessage, AIMessageChunk],
    });



    const messagesWithContent = messagesArray.filter((message: BaseMessage | AIMessageChunk) => {

      if (!message.content) return false;


      if (typeof message.content === "string") {
        return message.content.trim() !== "";
      }

      if (typeof message.content === "object") {
        return false;
      }
      return true;
    });



  


    let messages: BaseMessage[] = [];

    messages = messagesWithContent;


    if (messages.length === 0) {
      console.warn("No messages with content found");
      return [];
    }

    // Convert to the required format
    const extractedMessages = messages.map((message: BaseMessage) => {
      return {
        id: message.id ?? "",
        chatId: sessionId ?? "",
        isAI: isAIMessage(message),
        content: typeof message.content === "string" ? message.content : JSON.stringify(message.content),
      };
    });

    return extractedMessages.slice(0, limit); // Limit the number of messages returned
  } catch (error) {
    console.error("Error extracting messages from checkpoint:", error);
    return [];
  }
}
