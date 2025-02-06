import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

import { dbConfig } from "../config/database.ts";

const pool = new Pool(dbConfig,10);

export const getDbClient = async () =>
{
    return await pool.connect();
}


