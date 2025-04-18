import { insertUserSchema, selectUserSchema } from "../../drizzle/schema.ts";
import createErrorSchema from "stoker/openapi/schemas/create-error-schema";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";

import { Hono } from "npm:hono";
import { describeRoute } from 'hono-openapi';
import { createUser } from "./user.handler.ts";
const app = new Hono();
app.post(
  '/signup',
  
  describeRoute({
    tags: ['User'],
    description: 'Create user',
    request: {
      body: insertUserSchema,
    },
    responses: {
      200: {
        description: 'User created',
        content: {
          "text/plain": {
            schema: selectUserSchema,
          }
        },
      },
      422: {
        description: 'Validation error(s)',
        content: {
          "text/plain": {
            schema: createErrorSchema(insertUserSchema),
          }
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          "text/plain": {
            schema: createErrorSchema(insertUserSchema),
          }
        },
      },
    },
  }),
  verifyUserPermissions,
  createUser
)

export default app;



