import "jsr:@std/dotenv/load";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import * as pg from "npm:pg";

const DB_URL = Deno.env.get("DB_URL")!;
const pool = new Pool({connectionString: DB_URL});
const db = drizzle({client: pool});

const poolConfig = {
  host: Deno.env.get("DB_HOST"),
  port: 5432,
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
  ssl: true
};

const poolCheckpointer = new pg.Pool(poolConfig);
const checkpointer = new PostgresSaver(poolCheckpointer);
await checkpointer.setup();

export { db,checkpointer };