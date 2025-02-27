import { Hono } from "@hono/hono";

import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { getMistralResponse, getModelResponse } from "./models.handler.ts";


const app = new Hono();
app.post(
    '/chat-test',
    describeRoute({
        tags: ['Models'],
        description: 'Test Models',
        request: {
            body: z.object({
                message: z.string(),
            })
        },
        responses: {
            200: {
                description: 'Models tested',
                content: {
                    "text/plain": {
                        schema: z.object({ message: z.string() }),
                    }
                },
            },
            404: {
                description: 'Models not tested',
                content: {
                    "text/plain": {
                        schema: z.object({ message: z.string() }),
                    }
                },
            },
        }
    }),
    getModelResponse
)
.post(
    '/mistral-test',
    describeRoute({
        tags: ['Models'],
        description: 'Test Mistral',
        request: {
            body: z.object({
                message: z.string(),
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
    }), getMistralResponse
)

export default app;

