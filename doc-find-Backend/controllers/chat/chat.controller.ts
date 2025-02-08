import { Context } from "@hono/hono";
import { chatService } from "../../services/chat/chat.service.ts";
import { RouteHandler } from "@hono/zod-openapi";
import type { CreateChat, GetChat, GetChats, DeleteChat } from "../../routes/chat/chat.route.ts";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { insertChatSchema,} from "../../drizzle/schema.ts";
import { ChatNotFoundException } from "../../services/exceptions/ChatNotFoundException.ts";

export const createChat: RouteHandler<CreateChat> = async (c) => {
    const body = await c.req.json();
    const parsedBody = insertChatSchema.parse(body);
    const chat = await chatService.createChat(parsedBody);
    return c.json(chat, HttpStatusCodes.OK);
};

export const getChats: RouteHandler<GetChats> = async (c) => {
    const { userId } = c.req.valid("param");
    const chats = await chatService.getChats(userId);
    return c.json(chats, HttpStatusCodes.OK);
};

export const getChat: RouteHandler<GetChat> = async (c) => {
    try {
        const { id } = c.req.valid("param");
        const chat = await chatService.getChat(id);
        return c.json(chat, HttpStatusCodes.OK);
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, HttpStatusCodes.NOT_FOUND);
        }
        throw error;
    }
};

export const deleteChat: RouteHandler<DeleteChat> = async (c) => {
    try {
        const { id } = c.req.valid("param");
        await chatService.deleteChat(id);
        return c.json({
            message: "Chat with id " + id + " deleted",
        }, HttpStatusCodes.OK);
    } catch (error) {
        if (error instanceof ChatNotFoundException) {
            return c.json({ message: error.message }, HttpStatusCodes.NOT_FOUND);
        }
        throw error;
    }
};

