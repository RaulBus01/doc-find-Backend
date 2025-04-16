import { Context } from "@hono/hono";
import { getAIresponse } from "../../services/LLM.ts";
import { streamText } from '@hono/hono/streaming';

export const getModelResponse = async (c:Context) => {
    const message = await c.req.text();
    return streamText(c, async (stream) => {
      try {
        await getAIresponse(message, async (chunk) => {
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
export const getMistralResponse = async (c:Context) => {
  const message = await c.req.text();
  return streamText(c, async (stream) => {
    try {
      await getAIresponse(message, async (chunk) => {
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
