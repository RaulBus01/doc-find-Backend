import { z } from "@hono/zod-openapi";
export const ContextUserSchema = z.object({
    age: z.number(),
    gender: z.string(),
    smoker: z.enum(["Yes", "No", "I used to"]).optional(),
    hypertensive: z.enum(["Yes", "No", "I don't know"]).optional(),
    diabetic: z.enum(["Yes", "No", "I don't know"]).optional(),
    allergies: z.array(z.string()).optional(),
    medicalHistory: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
  }).strict();
  
export type ContextUser = z.infer<typeof ContextUserSchema>;