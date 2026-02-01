// db/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js"; // Standard relative path
import dotenv from "dotenv";

dotenv.config();

// ... pool configuration code ...

export const db = drizzle(pool, { schema });
