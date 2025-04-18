import { Hono } from "npm:hono";
import { zValidator } from "npm:@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { ContextUserSchema } from "../../types/ContextType.ts";
import { streamText } from "hono/streaming";
import { getAPIResponse } from "../../services/LLM.ts";


const RequestBodySchema = z.object({
  message: z.string(),
  context: ContextUserSchema.optional(),
});


const app = new Hono();
app.post(
  '/mistral-test',
  zValidator('json', RequestBodySchema),
  describeRoute({
    tags: ['Models'],
    description: 'Test Mistral',
    request: {
      body: z.object({
        message: z.string(),
        context: ContextUserSchema.optional(),
      })
    },
    responses: {
      200: {
        description: 'Mistral tested',
        content: {
          "text/plain": {
            schema: z.object({ message: z.string() }),
          }
        },
      },
      404: {
        description: 'Mistral not tested',
        content: {
          "text/plain": {
            schema: z.object({ message: z.string() }),
          }
        },
      },
    }
  }),
  (c) => {
    const { message, context } = c.req.valid('json');
    return streamText(c, async (stream) => {
      try {
        await getAPIResponse(message, context, async (chunk) => {
          if (chunk) {
            await stream.write(chunk);
          }
        });
      } catch (error) {
        console.error('Streaming error:', error);
        await stream.write('Error occurred while processing the request');
      }
    });
  }
)

export default app;

