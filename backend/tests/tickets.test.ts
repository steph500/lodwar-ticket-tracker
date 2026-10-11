import "dotenv/config";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import request from "supertest";
import type { Express } from "express";
import type { Pool } from "pg";
import type { Ticket, TicketStatus } from "../src/tickets/ticket.types";

let app: Express;
let pool: Pool;

before(async () => {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl)
    throw new Error(
      "Set TEST_DATABASE_URL to a dedicated PostgreSQL test database.",
    );
  const databaseName = new URL(testUrl).pathname.slice(1);
  const developmentName = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).pathname.slice(1)
    : "";
  if (!databaseName.endsWith("_test") || databaseName === developmentName) {
    throw new Error(
      "Refusing to reset data: test database must be separate and end in _test.",
    );
  }
  process.env.DATABASE_URL = testUrl;
  ({ pool } = await import("../src/config/database"));
  ({ app } = await import("../src/app"));
  const existing = await pool.query(
    "SELECT to_regclass('public.tickets') AS name",
  );
  if (!existing.rows[0].name) {
    const migration = await readFile(
      join(__dirname, "../db/migrations/001_create_tickets.sql"),
      "utf8",
    );
    await pool.query(migration);
  }
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tickets");
});
after(async () => {
  if (pool) {
    try {
      await pool.query("TRUNCATE TABLE tickets");
    } finally {
      await pool.end();
    }
  }
});

test("creates a persisted ticket with defaults and restricts updates to status and priority", async () => {
  await request(app)
    .post("/tickets")
    .send({ title: " ", priority: "high" })
    .expect(400);
  await request(app)
    .post("/tickets")
    .send({ title: "Missing priority" })
    .expect(400);
  await request(app)
    .post("/tickets")
    .send({ title: "Invalid status", priority: "low", status: "other" })
    .expect(400);

  const created = await request(app)
    .post("/tickets")
    .send({ title: "  Cannot log in  ", priority: "high" })
    .expect(201);
  const ticket = created.body as Ticket;
  assert.match(ticket.id, /^[0-9a-f-]{36}$/);
  assert.equal(ticket.title, "Cannot log in");
  assert.equal(ticket.description, null);
  assert.equal(ticket.status, "open");
  assert.equal(ticket.priority, "high");
  assert.ok(Number.isFinite(Date.parse(String(ticket.created_at))));
  const stored = await pool.query<Ticket>(
    "SELECT * FROM tickets WHERE id = $1",
    [ticket.id],
  );
  assert.equal(stored.rows[0].title, ticket.title);

  await request(app)
    .patch(`/tickets/${ticket.id}`)
    .send({ title: "Forbidden" })
    .expect(400);
  await request(app)
    .patch(`/tickets/${ticket.id}`)
    .send({ status: "invalid" })
    .expect(400);
  const updated = await request(app)
    .patch(`/tickets/${ticket.id}`)
    .send({ status: "closed", priority: "low" })
    .expect(200);
  assert.equal(updated.body.status, "closed");
  assert.equal(updated.body.priority, "low");
  assert.equal(updated.body.title, ticket.title);
  assert.equal(updated.body.created_at, ticket.created_at);
  await request(app)
    .patch("/tickets/00000000-0000-0000-0000-000000000000")
    .send({ status: "closed" })
    .expect(404);
});

test("filters by status and uses pagination with correct totals even beyond the last page", async () => {
  for (const status of ["open", "closed", "open", "open"] as TicketStatus[]) {
    await request(app)
      .post("/tickets")
      .send({ title: `Ticket ${status}`, priority: "medium", status })
      .expect(201);
  }
  const first = await request(app)
    .get("/tickets?status=open&page=1&limit=2")
    .expect(200);
  const second = await request(app)
    .get("/tickets?status=open&page=2&limit=2")
    .expect(200);
  assert.equal(first.body.total, 3);
  assert.equal(first.body.page, 1);
  assert.equal(first.body.limit, 2);
  assert.equal(first.body.items.length, 2);
  assert.equal(second.body.items.length, 1);
  const items = [...first.body.items, ...second.body.items] as Ticket[];
  assert.ok(items.every((ticket) => ticket.status === "open"));
  assert.equal(new Set(items.map((ticket) => ticket.id)).size, 3);
  const empty = await request(app)
    .get("/tickets?status=open&page=99&limit=2")
    .expect(200);
  assert.equal(empty.body.total, 3);
  assert.deepEqual(empty.body.items, []);
  await request(app).get("/tickets?status=invalid").expect(400);
  await request(app).get("/tickets?page=0").expect(400);
  await request(app).get("/tickets?limit=101").expect(400);
});

test("returns grouped counts including zeroes and reflects status changes", async () => {
  const empty = await request(app).get("/tickets/stats").expect(200);
  assert.deepEqual(empty.body, { open: 0, in_progress: 0, closed: 0 });
  let ticketId = "";
  for (const status of [
    "open",
    "open",
    "in_progress",
    "closed",
  ] as TicketStatus[]) {
    const response = await request(app)
      .post("/tickets")
      .send({
        title: `Stats ${status}`,
        description: "Count this ticket",
        priority: "low",
        status,
      })
      .expect(201);
    if (status === "open") ticketId = response.body.id;
  }
  const counts = await request(app).get("/tickets/stats").expect(200);
  assert.deepEqual(counts.body, { open: 2, in_progress: 1, closed: 1 });
  await request(app)
    .patch(`/tickets/${ticketId}`)
    .send({ status: "closed" })
    .expect(200);
  const changed = await request(app).get("/tickets/stats").expect(200);
  assert.deepEqual(changed.body, { open: 1, in_progress: 1, closed: 2 });
});
