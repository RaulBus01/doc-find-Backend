import {load} from "@std/dotenv"
import "jsr:@std/dotenv/load";
await load({export:true})

export const dbConfig = {
    host: Deno.env.get("DB_HOST"),
    database: Deno.env.get("DB_NAME"),
    user: Deno.env.get("DB_USER"),
    password: Deno.env.get("DB_PASSWORD")
}

