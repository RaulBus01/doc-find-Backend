import { Hono } from "npm:hono";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";
import { describeRoute } from 'hono-openapi';
import { attachUser } from "../../middlewares/User.middleware.ts";
import { selectChatSchema, selectMessagesHistorySchema } from "../../drizzle/schema.ts";
import { z } from "npm:@hono/zod-openapi";
import { createChat, getChat, getChatMessages,deleteChat, getChats, generateChatTitle, getChatLastMessages, getChatCount } from "./chat.handler.ts";
import { resolver, validator as zValidator } from "hono-openapi/zod";
const app = new Hono();
app.post(
  '/',
  describeRoute({
    tags: ['Chat'],
    description: 'Create chat',
    responses: {
      200: {
        description: 'Chat created',
        content: {
          "application/json": {
            schema: resolver(selectChatSchema),
          }
        },
      },
      404: {
        description: 'Chat not created',
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
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
    '/counter',
    describeRoute({
      tags: ['Chat'],
      description: 'Get chat count',
      responses: {
        200: {
          description: 'Chat count',
          content: {
            "application/json": {
              schema: resolver(z.object({ count: z.number() })),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: resolver(z.object({ message: z.string() })),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    getChatCount
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
            "application/json": {
              schema: resolver(selectChatSchema.array()),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            }
          },
        },
      },
    }),
    zValidator('query', z.object({
      limit: z.string().optional(),
    })),
    verifyUserPermissions,
    attachUser,
    getChats
  )
  .get(
    '/:id',
    describeRoute({
      tags: ['Chat'],
      description: 'Get chat by id',

      responses: {
        200: {
          description: 'Chat',
          content: {
            "application/json": {
              schema: resolver(selectChatSchema), 
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: resolver(z.object({ message: z.string() })),
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

      responses: {
        200: {
          description: 'Chat deleted',
          content: {
            "application/json": {
              schema:resolver(z.object({ message: z.string() })),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema:resolver(z.object({ message: z.string() })),
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
      responses: {
        200: {
          description: 'Message added',
          content: {
            "application/json": {
              schema: resolver(selectMessagesHistorySchema)
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: resolver(z.object({ message: z.string() })),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
  
  )
  .get(
    '/:id/messages',
    describeRoute({
      tags: ['Chat'],
      description: 'Get chat messages',
  
      responses: {
        200: {
          description: 'List of chat messages',
          content: {
            "application/json": {
              schema: resolver(selectMessagesHistorySchema.array()),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: resolver(z.object({ message: z.string() })),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    getChatMessages
  )
  .get(
    '/:id/lastMessages/:limit',
    describeRoute({
      tags: ['Chat'],
      description: 'Get last messages of chat',
      responses: {
        200: {
          description: 'List of chat messages',
          content: {
            "text/plain": {
              schema: resolver(selectMessagesHistorySchema.array()),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: resolver(z.object({ message: z.string() })),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    getChatLastMessages
    )
  .post(
    '/:id/generateChatTitle',
    describeRoute({
      tags: ['Chat'],
      description: 'Generate a title for the chat',
      responses: {
        200: {
          description: 'Title generated successfully',
          content: {
            "application/json": {
              schema: resolver(selectChatSchema),
            }
          },
        },
        404: {
          description: 'Chat not found',
          content: {
            "text/plain": {
              schema: resolver(z.object({ message: z.string() })),
            }
          },
        },
      },
    }),
    verifyUserPermissions,
    attachUser,
    generateChatTitle
  )

 


export default app;
