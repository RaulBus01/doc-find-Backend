import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";
import { createMessageObjectSchema } from "stoker/openapi/schemas";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

export function createRouter(){
    return new OpenAPIHono({
        strict:false,
        defaultHook,
})}

export default function createApp(){
    const app = createRouter();

    app.use(serveEmojiFavicon("🦕"));
    app.notFound(notFound);
    app.onError(onError);

    return app;
}


export const notFoundSchema = createMessageObjectSchema(HttpStatusPhrases.NOT_FOUND);