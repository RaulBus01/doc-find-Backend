import { Hono } from "npm:hono";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

import { getAPIResponse} from "../../services/ai-service.ts";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";
import { attachUser } from "../../middlewares/User.middleware.ts";
import { Logger } from "../../utils/logger.ts";
import { validateStreamAndSaveRequest,StreamAndSaveSchema } from "../../middlewares/Model.middleware.ts";

const logger = new Logger("ModelsRoute");
const app = new Hono();

app.post(
  '/stream-and-save',
  describeRoute({
    tags: ['Models'],
    description: 'Stream AI response and save to database',
    request: {
      body: StreamAndSaveSchema
    },
    responses: {
      200: {
        description: 'AI response streamed and saved',
        content: {
          "text/event-stream": {
            schema: z.object({
              message: z.string(),
            }),
          },
        }
      },
    
      500: {
        description: 'Error processing request',
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          }
        },
      },
    }
  }),
  verifyUserPermissions,
  attachUser,
  validateStreamAndSaveRequest,
  (c) => {
    const { message, chatId, context,userId } = c.req.valid('json');

    const stream = new ReadableStream({
      async start(controller) {
        let completeResponse = "";
        
        try {
          // Stream AI response to client while accumulating it
          await getAPIResponse(chatId,message, context, async (chunk: string) => {

            if (chunk) {
              // Send chunk to client
              controller.enqueue(new TextEncoder().encode(chunk));
              // Add to complete response
              completeResponse += chunk;
            }
          });
          
        
        } catch (error) {

          const errorToLog = error instanceof Error ? error : new Error(String(error));
          logger.error("Error in streaming AI response", errorToLog, { userId });
          controller.enqueue(new TextEncoder().encode("Error: Failed to process AI response"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }
);

export default app;


