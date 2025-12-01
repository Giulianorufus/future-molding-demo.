import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DB_USER) throw new Error("Missing DB_USER");
if (!process.env.DB_PASSWORD) throw new Error("Missing DB_PASSWORD");
if (!process.env.DB_HOST) throw new Error("Missing DB_HOST");
if (!process.env.DB_NAME) throw new Error("Missing DB_NAME");
if (!process.env.DB_PORT) throw new Error("Missing DB_PORT");

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export default pool;
