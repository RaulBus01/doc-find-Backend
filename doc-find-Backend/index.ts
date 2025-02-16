import app from "./app.ts";
import "jsr:@std/dotenv/load";

const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`Server running on port ${port}`);

Deno.serve({ port: +port },app.fetch);


