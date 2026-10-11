import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pool } from "../src/config/database";

async function migrate(): Promise<void> {
  try {
    const sql = await readFile(
      join(__dirname, "migrations/001_create_tickets.sql"),
      "utf8",
    );
    await pool.query(sql);
    console.log(
      "Ticket schema created. Run this migration once per empty database.",
    );
  } finally {
    await pool.end();
  }
}

migrate().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
