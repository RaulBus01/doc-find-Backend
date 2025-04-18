import "jsr:@std/dotenv/load";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
const DB_URL = Deno.env.get("DB_URL")!;
const pool = new Pool({connectionString: DB_URL});
const db = drizzle({client: pool});

export { db };