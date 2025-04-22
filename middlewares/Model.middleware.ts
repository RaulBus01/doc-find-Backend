
import { validator} from "npm:hono/validator";
import { z } from "@hono/zod-openapi";
import { ContextUserSchema } from "../types/ContextType.ts";
import { AIModel } from "../types/types.ts";


import { Logger } from "../utils/logger.ts";

const logger = new Logger("ModelsMiddleware");
export const StreamAndSaveSchema = z.object({
    message: z.string().min(1, "Message cannot be empty"),
    chatId: z.number().int().positive("Chat ID must be a positive integer"), 
    modelType: z.enum([
        AIModel.MISTRAL_SMALL,
        AIModel.MISTRAL_LARGE,
        AIModel.GEMINI_FLASH_LITE,
    ]),
    context: ContextUserSchema.optional(),
});




export const validateStreamAndSaveRequest = validator('json', (value,c) => {
    const user = c.get("user");
    const parsed = StreamAndSaveSchema.safeParse(value);
    if (!parsed.success) {
      logger.error("Invalid request body", parsed.error, { userId: user.id });
      return c.text( 'Invalid request body' , 400);
    }
    return {
      ...parsed.data,
      userId: user.id 
    }
  
});