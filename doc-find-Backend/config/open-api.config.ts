import {apiReference} from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import "jsr:@std/dotenv/load";

export default function configureOpenAPI(app: OpenAPIHono) {
    app.doc("/doc", {
        openapi: "3.0.0",
        info: {
          version: Deno.env.get("API_VERSION") || "1.0.0",
          title: "Tasks API",
        },
      });
    
      app.get(
        "/reference",
        apiReference({
          theme: "kepler",
          layout: "classic",
          defaultHttpClient: {
            targetKey: "javascript",
            clientKey: "fetch",
          },
          spec: {
            url: "/doc",
          },
        }),
      );
}