import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD, "type:", typeof process.env.DB_PASSWORD);
  
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "school_van_db",
  });
  
  try {
    await client.connect();
    console.log("Connected successfully");
    await client.end();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

run();
