import { Hono } from "@hono/hono";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";
import { describeRoute } from 'hono-openapi';
import { attachUser } from "../../middlewares/User.middleware.ts";
import { selectChatSchema, selectMessageSchema } from "../../drizzle/schema.ts";
import { z } from "@hono/zod-openapi";
import { createChat, getChat, getChatMessages,deleteChat, addChatMessage, getChats } from "./chat.handler.ts";


const app = new Hono();
app.post(
  '/',
  describeRoute({
    tags: ['Chat'],
    description: 'Create chat',
    request: {
      body: z.object({
        message: z.string(),
      })
    },
    responses: {
      200: {
        description: 'Chat created',
        content: {
          "text/plain": {
            schema: selectChatSchema,
          }
        },
      },
      404: {
        description: 'Chat not created',
        content: {
          "text/plain": {
            schema: z.object({ message: z.string() }),
          }
        },
      },
    },
  }),
  verifyUserPermissions,
  attachUser,
  createChat
)
.get(
    '/getChats/',
    describeRoute({
      tags: ['Chat'],
      description: 'Get all chats',
      responses: {
        200: {
          description: 'List of user chats',
          content: {
            "text/plain": {
              schema: selectChatSchema.array(),

            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    getChats
  )
  .get(
    '/:id',
    describeRoute({
      tags: ['Chat'],
      description: 'Get chat by id',
      request:{
        params:z.object({
          id:z.string()
        })
      },
      responses: {
        200: {
          description: 'Chat',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    getChat 
  )
  .delete(
    '/:id',
    describeRoute({
      tags: ['Chat'],
      description: 'Delete chat by id',
      request:{
        params:z.object({
          id:z.string()
        })
      },
      responses: {
        200: {
          description: 'Chat deleted',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    deleteChat
  )
  .post(
    '/:id/addMessage',
    describeRoute({
      tags: ['Chat'],
      description: 'Add message to chat',
      request:{
        params:z.object({
          id:z.string()
        }),
        body:z.object({
          message:z.string()
        })
      },
      responses: {
        200: {
          description: 'Message added',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    addChatMessage
  )
  .get(
    '/:id/messages',
    describeRoute({
      tags: ['Chat'],
      description: 'Get chat messages',
      request:{
        params:z.object({
          id:z.string()
        })
      },
      responses: {
        200: {
          description: 'List of chat messages',
          content: {
            "text/plain": {
              schema: selectMessageSchema.array(),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: z.object({ message: z.string() }),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    getChatMessages
  )

 


export default app;
