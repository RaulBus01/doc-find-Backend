import { Hono } from "npm:hono";
import { describeRoute } from "hono-openapi";
import { z } from "npm:@hono/zod-openapi";
import { getAPIResponse} from "../../services/ai-service.ts";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";

import { Logger } from "../../utils/logger.ts";
import { validateStreamAndSaveRequest,StreamAndSaveSchema } from "../../middlewares/Model.middleware.ts";
import { resolver, validator as zValidator } from "hono-openapi/zod";
const logger = new Logger("ModelsRoute");
const app = new Hono();

app.post(
  '/stream-and-save',
  describeRoute({
    tags: ['Models'],
    description: 'Stream AI response and save to database',
 
    responses: {
      200: {
        description: 'AI response streamed and saved',
        content: {
          "text/event-stream": {
            schema: resolver(z.object({
              message: z.string(),
            })),
          },
        }
      },
      400: {
        description: 'Invalid request',
        content: {
          "application/json": {
            schema: resolver(z.object({
              error: z.string(),
            })),
          }
        },
      },
    
      500: {
        description: 'Error processing request',
        content: {
          "application/json": {
            schema: resolver(z.object({ error: z.string() })),
          }
        },
      },
    }
  }),
  verifyUserPermissions,
  validateStreamAndSaveRequest,
  (c) => {
    const { message, chatId, context,userId } = c.req.valid('json');
    const abortSignal = c.req.raw.signal;
  
    const stream = new ReadableStream({
      async start(controller) {
        let completeResponse = "";
        
        const onAbort = () => {
          logger.warn("Streaming aborted by client");
          controller.close();
        }
        abortSignal?.addEventListener("abort", onAbort);
        try {
          // Stream AI response to client while accumulating it
          await getAPIResponse(chatId,message,context, (chunk: string) => {
            if (chunk) {
              controller.enqueue(new TextEncoder().encode(chunk));

              completeResponse += chunk;
            }
          }, abortSignal);

          
        
        } catch (error) {

          const errorToLog = error instanceof Error ? error : new Error(String(error));
          controller.error(errorToLog);
     
   
        } finally {
          abortSignal?.removeEventListener("abort", onAbort);
          controller.close();
        }
      },
      cancel(reason) {
        logger.warn("Streaming cancelled", reason);
        
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


