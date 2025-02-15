import { Hono } from "@hono/hono";
import chat from "./routes/chat/chat.route.ts";
import user from "./routes/user/user.route.ts";
import { openAPISpecs } from 'hono-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon";


const app = new Hono();
app.use(serveEmojiFavicon("🦕"));
app.get(
  '/openapi',
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'Hono API',
        version: '1.0.0',
        description: 'Greeting API',
      },
      servers: [
        { url: 'http://localhost:8000', description: 'Local Server' },
      ],
    },
  })
)
app.get(
  '/docs',
  apiReference({
    theme: "kepler",
    layout: "classic",
    defaultHttpClient: {
      targetKey: "javascript",
      clientKey: "fetch",
    },
    spec: {
      url: "/openapi",
    },
  })
)


const routes = app
    .route("/chat",chat)
    .route("/user",user)

export type AppType = typeof routes;

export default app;

    

