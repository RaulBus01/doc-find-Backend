import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { insertChatSchema } from "../../drizzle/schema.ts";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import createErrorSchema from "stoker/openapi/schemas/create-error-schema";


const tags = ["User"];
export const create  = createRoute({
    path: "/signup",
    method: "post",
    tags,
    request:{
        body: jsonContentRequired(
            insertChatSchema,
            "User to create"
        )
    }
    ,
    responses:{
        [HttpStatusCodes.OK]: jsonContent(
            insertChatSchema,
            "User created"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertChatSchema),
            "The validation error(s)",
          ),
        },
    }
);


