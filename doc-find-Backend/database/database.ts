import { drizzle } from "drizzle-orm/neon-http";
import { neon } from '@neondatabase/serverless';
import "jsr:@std/dotenv/load";


const DB_URL = Deno.env.get("DB_URL")!;
const sql = neon(DB_URL);

const db = drizzle({client:sql});

export { db };