import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL?.trim() || "file:./data/banknearme.db";
const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

const client = createClient({
  url: databaseUrl,
  ...(authToken ? { authToken } : {}),
});

export const db = drizzle(client, { schema });
