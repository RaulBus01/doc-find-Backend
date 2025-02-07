import app from "./app.ts";
import "jsr:@std/dotenv/load";

const port = Deno.env.get("PORT") || 3000;

console.log(`Server running on port ${port}`);

Deno.serve({ port: +port },app.fetch);


