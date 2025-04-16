import { Context } from "npm:hono";
import { chatService } from "../../services/chat/chat.service.ts";
import { ChatNotFoundException } from "../../services/exceptions/ChatNotFoundException.ts";


export const getChats = async (c:Context) => {
      try{
      const user = c.get("user");
      const limit = c.req.query('limit')
      const chats = await chatService.getChats(user.id,limit);
      return c.json(chats, 200);
      }
      catch (error) {
          if (error instanceof ChatNotFoundException) {
              return c.json({ message: error.message }, 404);
          }
          throw error;
      }
    }
export const getChat = async (c:Context) => {
    try {
        const { id } = c.req.param();
        const user = c.get("user");
        const chat = await chatService.getChat(parseInt(id), user.id);
        return c.json(chat, 200);
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
}
export const createChat = async (c: Context) => {
    try {
        const user = c.get("user");
        const { message } = await c.req.json();
        
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return c.json({ message: "Initial message cannot be empty." }, 400);
        }
        
        const insertChat = {
            userId: user.id,
            title: "New Chat", // Default title that will be replaced
        };
        
        // The createChatWithMessage now returns { chat, messages }
        const result = await chatService.createChatWithMessage(insertChat, message);
        
        return c.json(result, 201); // Return the chat and messages
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        console.error("Error in createChat:", error);
        return c.json({ 
            message: "Failed to create chat", 
            error: error instanceof Error ? error.message : String(error) 
        }, 500);
    }
}
export const deleteChat = async (c:Context) => {
    try {
        const { id } = c.req.param();
        const user = c.get("user");
        await chatService.deleteChat(parseInt(id), user.id);
        return c.json({
            message: "Chat deleted with id: " + id + " successfully"
        }, 200);
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
}

export const addChatMessage = async (c:Context) => {
    try {
        const { id } = c.req.param();
        const user = c.get("user");
        const { message,isAI } = await c.req.json();
        const messageData = await chatService.addMessage(parseInt(id), user.id, message,isAI);
        return c.json(messageData, 200);
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
}

export const getChatMessages = async (c:Context) => {
    try{
    const { id } = c.req.param();
    const user = c.get("user");
    const chats = await chatService.getChatMessages(parseInt(id), user.id);
    return c.json(chats, 200);
    }
    catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
  }
  export const generateChatTitle = async (c: Context) => {
    try {
      const { id } = c.req.param();
      const user = c.get("user");
      const updatedChat = await chatService.generateAndUpdateTitle(parseInt(id), user.id);
      return c.json(updatedChat, 200);
    } catch (error) {
      if (error instanceof ChatNotFoundException) {
        return c.json({ message: error.message }, 404);
      }
      console.error("Error generating title:", error);
      return c.json({ 
        message: "Failed to generate chat title", 
        error: error instanceof Error ? error.message : String(error) 
      }, 500);
    }
  }