import { Hono } from "npm:hono"
import chat from "./routes/chat/chat.route.ts";
import models from "./routes/models/models.route.ts";
import { openAPISpecs } from 'hono-openapi'
import { Scalar } from 'npm:@scalar/hono-api-reference'
import { cors } from 'npm:hono/cors'

const app = new Hono();
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
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
      tags: [
        { name: 'Chat', description: 'Chat related endpoints' },
        { name: 'Models', description: 'Model related endpoints' },
      ],
      servers: [
        { url: 'http://localhost:8080', description: 'Local Server' },
        { url: 'https://docfind-backend.deno.dev/', description: 'Production Server' },
      ],
    },
  })
)
app.get(
  '/docs',
  Scalar({
    theme: "kepler",
    layout: "classic",
    title: "DocFind API",
    url: "/openapi",
    
  })
) 



const routes = app
    .route("/chat",chat)
    .route("/completion", models)

export type AppType = typeof routes;

export default app;

    

