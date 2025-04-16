import { Hono } from "npm:hono"
import chat from "./routes/chat/chat.route.ts";
import user from "./routes/user/user.route.ts";
import models from "./routes/models/models.route.ts";
import { openAPISpecs } from 'hono-openapi'
import { Scalar } from 'npm:scalar/hono-api-reference'
import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon";
import { cors } from 'npm:hono/cors'

const app = new Hono();
app.use(serveEmojiFavicon("🦕"));
app.use(cors());
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
        { url: 'http://localhost:8080', description: 'Local Server' },
      ],
    },
  })
)
app.get(
  '/docs',
  Scalar({
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
    .route("/completion", models)

export type AppType = typeof routes;

export default app;

    

