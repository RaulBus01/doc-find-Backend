import { OpenAPIHono } from "@hono/zod-openapi";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";


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
