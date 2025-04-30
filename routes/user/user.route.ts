import { insertUserSchema, selectUserSchema } from "../../drizzle/schema.ts";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";

import { Hono } from "npm:hono";
import { describeRoute } from 'hono-openapi';
import { createUser } from "./user.handler.ts";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "npm:zod";
const app = new Hono();
app.post(
  '/signup',
  describeRoute({
    tags: ['User'],
    description: 'Create user',
    responses: {
      200: {
        description: 'User created',
        content: {
          "text/plain": {
            schema: resolver(selectUserSchema),
          }
        },
      },
      422: {
        description: 'Validation error(s)',
        content: {
          "text/plain": {
            schema: resolver(insertUserSchema),
          }
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          "text/plain": {
            schema: resolver(z.object({
              message: z.string()}))
          }
        },
      },
    },
  }),
  verifyUserPermissions,
  createUser
)

export default app;



