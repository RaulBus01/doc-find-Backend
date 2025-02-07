import { Context } from "@hono/hono";
import { chatService } from "../../services/chat/chat.service.ts";
import { RouteHandler } from "@hono/zod-openapi";
import type { create} from "../../routes/chat/chat.route.ts";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { insertChatSchema } from "../../drizzle/schema.ts";


export const createChat: RouteHandler<typeof create> = async (c) => {
  const body = await c.req.json();
  const parsedBody = insertChatSchema.parse(body); 
  const chat = await chatService.createChat(parsedBody);
  return c.json(chat, HttpStatusCodes.OK);
};

export const getChats = async (c: Context) => {
  const userId = c.req.param('userId');
  const chats = await chatService.getChats(userId);
  return c.json(chats, HttpStatusCodes.OK);
};

