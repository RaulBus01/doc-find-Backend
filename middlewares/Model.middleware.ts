
import { validator} from "npm:hono/validator";
import { z } from "npm:@hono/zod-openapi";
import { ContextUserSchema } from "../types/ContextType.ts";



import { Logger } from "../utils/logger.ts";

const logger = new Logger("ModelsMiddleware");
export const StreamAndSaveSchema = z.object({
    message: z.string().min(1, "Message cannot be empty"),
    chatId: z.string().min(1, "Chat ID is required"),
    context: ContextUserSchema.optional(),
});




export const validateStreamAndSaveRequest = validator('json', (value,c) => {
    const userId = c.get("userId");
    const parsed = StreamAndSaveSchema.safeParse(value);
    if (!parsed.success) {
      logger.error("Invalid request body", parsed.error, { userId: userId });
      return c.text( 'Invalid request body' , 400);
    }
    return {
      ...parsed.data,
      userId: userId,
    }
  
});