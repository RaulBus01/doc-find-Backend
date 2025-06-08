import { Hono } from "npm:hono";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";
import { describeRoute } from 'hono-openapi';

import { selectChatSchema} from "../../drizzle/schema.ts";
import { z } from "npm:@hono/zod-openapi";
import { createChat, deleteChat, generateChatTitle, getChatMessages } from "./chat.handler.ts";
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
  createChat
).get(
    '/:id/messages',
    describeRoute({
      tags: ['Chat'],
      description: 'Get chat messages',
  
      responses: {
        200: {
          description: 'List of chat messages',
          content: {
            "application/json": {
              
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

    getChatMessages
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

    deleteChat
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
    generateChatTitle
  )

 


export default app;
