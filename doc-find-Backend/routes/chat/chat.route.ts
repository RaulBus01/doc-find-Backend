import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { insertChatSchema,selectChatSchema } from "../../drizzle/schema.ts";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import createErrorSchema from "stoker/openapi/schemas/create-error-schema";
import { z } from "@hono/zod-openapi";
import IdParamsSchema from "stoker/openapi/schemas/id-params";
import { notFoundSchema } from "../../config/create-app.ts";

const tags = ["Chat"];
export const create  = createRoute({
    path: "/chat",
    method: "post",
    tags,
    request:{
        body: jsonContentRequired(
            insertChatSchema,
            "Chat to create"
        )
    }
    ,
    responses:{
        [HttpStatusCodes.OK]: jsonContent(
            insertChatSchema,
            "Chat created"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertChatSchema),
            "The validation error(s)",
          ),
        },
    }
);

export const getChats  = createRoute({
    path: "/chat/getChats/{userId}",
    method: "get",
    tags,
    request:{
        params: z.object({
            userId: z.string().transform((val: string) => parseInt(val))
        })
    },

    responses:{
        [HttpStatusCodes.OK]: jsonContent(
            selectChatSchema.array(),
            "List of user chats"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(selectChatSchema),
            "The validation error(s)",
          ),
        },
    }
);

export const getChat  = createRoute({
    path: "/chat/getChat/{id}",
    method: "get",
    tags,
    request:{
        params: IdParamsSchema
    },

    responses:{
        [HttpStatusCodes.OK]: jsonContent(
            selectChatSchema,
            "Single chat details"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            z.object({ message: z.string() }),
            "Chat not found"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(selectChatSchema),
            "The validation error(s)",
        ),
    }}
    
);


export const deleteChat  = createRoute({
    path: "/chat/deleteChat/{id}",
    method: "delete",
    tags,
    request:{
        params: IdParamsSchema
    },

    responses:{
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ message: z.string() }),
            "Chat deleted successfully"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            z.object({ message: z.string() }),
            "Chat not found"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(z.object({ id: z.number() })),
            "Invalid id error",
        ),
    }
}
);





    
export type CreateChat = typeof create;
export type GetChats = typeof getChats;
export type GetChat = typeof getChat;
export type DeleteChat = typeof deleteChat;

