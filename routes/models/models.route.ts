import { Hono } from "npm:hono";
import { zValidator } from "npm:@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { ContextUserSchema } from "../../types/ContextType.ts";
import { streamText } from "hono/streaming";
import { getAPIResponse } from "../../services/LLM.ts";
import { verifyUserPermissions } from "../../middlewares/Auth.middleware.ts";
import { attachUser } from "../../middlewares/User.middleware.ts";
import { chatService } from "../../services/chat/chat.service.ts";
import { validator} from "npm:hono/validator";

const RequestBodySchema = z.object({
  message: z.string(),
  context: ContextUserSchema.optional(),
});

const StreamAndSaveSchema = z.object({
  message: z.string(),
  chatId: z.number(),
  context: ContextUserSchema.optional(),
});

const app = new Hono();
app.post(
  '/mistral-test',
  validator('json', (value,c) => {

    const parsed = RequestBodySchema.safeParse(value);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.errors); 
      return c.text( 'Invalid request body' , 400);
    }
    return parsed.data;
  
  }),

  describeRoute({
    
    tags: ['Models'],
    description: 'Test Mistral',
    request: {

      body: RequestBodySchema
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
             // Log the chunk for debugging
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
            schema: z.string(),
          }
        },
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
  validator('json', (value,c) => {
    const user = c.get("user");
    const parsed = StreamAndSaveSchema.safeParse(value);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.errors); 
      return c.text( 'Invalid request body' , 400);
    }
    return {
      ...parsed.data,
      userId: user.id // Attach user ID to the parsed data
    }
  
  }),
  
  (c) => {
    const { message, chatId, context,userId } = c.req.valid('json');

    const stream = new ReadableStream({
      async start(controller) {
        // Accumulate the full response
        let completeResponse = "";
        
        try {
          // Stream AI response to client while accumulating it
          await getAPIResponse(message, context, async (chunk: string) => {

            if (chunk) {
              // Send chunk to client
              controller.enqueue(new TextEncoder().encode(chunk));
              // Add to complete response
              completeResponse += chunk;
            }
          });
          
          // Once streaming is complete, save the full response to the database
          if (completeResponse) {
            await chatService.addMessage(
              chatId, 
              userId,
              completeResponse,
              true // isAI = true
            );
          }
        } catch (error) {
          console.error("AI streaming error:", error);
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