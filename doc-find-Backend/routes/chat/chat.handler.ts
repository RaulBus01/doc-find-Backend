import { Context } from "@hono/hono";
import { chatService } from "../../services/chat/chat.service.ts";
import { ChatNotFoundException } from "../../services/exceptions/ChatNotFoundException.ts";


export const getChats = async (c:Context) => {
      try{
      const user = c.get("user");
      const chats = await chatService.getChats(user.id);
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
        const chat = await chatService.getChat(id, user.id);
        return c.json(chat, 200);
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
}
export const createChat = async (c:Context) => {
    try{
    const user = c.get("user");
    const {message} =  await c.req.json();
    const insertChat = {
        userId: user.id,
        title: "Chat with Ola"
    }
    const chat = await chatService.createChatWithMessage(insertChat, message);
    return c.json(chat, 200);
    }
    catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error
    }
}
export const deleteChat = async (c:Context) => {
    try {
        const { id } = c.req.param();
        const user = c.get("user");
        await chatService.deleteChat(id, user.id);
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
        const { message } = await c.req.json();
        const messageData = await chatService.addMessage(id, user.id, message);
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
    const chats = await chatService.getChatMessages(id, user.id);
    return c.json(chats, 200);
    }
    catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, 404);
        }
        throw error;
    }
  }
