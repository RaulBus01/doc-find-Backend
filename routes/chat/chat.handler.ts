import { Context } from "npm:hono";
import { chatService } from "../../services/chat/chat.service.ts";
import { ChatNotFoundException } from "../../services/exceptions/ChatNotFoundException.ts";





export const createChat = async (c: Context) => {
    try {
        const userId = c.get("userId");
     
        const insertChat = {
            userId: userId,
            title: "New Chat", // Default title that will be replaced
        };
        

        const result = await chatService.createChatWithMessage(insertChat);
        
        return c.json(result, 201); 
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
export const getChatMessages = async (c:Context) => {
    try{
    const {id} = c.req.param();
    const userId = c.get("userId");

    const messages = await chatService.getChatMessages(parseInt(id), userId);
    if (messages && messages.length === 0) {
        return c.json({ message: "No messages found for this chat." }, 404);
    } else {
        return c.json(messages, 200);
    }
    
    }
    catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
  }
export const deleteChat = async (c:Context) => {
    try {

        const { id } = c.req.param();

        const userId = c.get("userId");
        await chatService.deleteChat(parseInt(id), userId);
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
export const generateChatTitle = async (c: Context) => {
    try {
      const { id } = c.req.param();
      const userId = c.get("userId");
      const updatedChat = await chatService.generateAndUpdateTitle(parseInt(id), userId);
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