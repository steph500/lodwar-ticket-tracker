import { randomUUID } from 'node:crypto';
import { pool } from '../config/database';
import { CreateTicket, ListOptions, Ticket, TicketPage } from './ticket.types';

export async function createTicket(input: CreateTicket): Promise<Ticket> {
  const result = await pool.query<Ticket>(
    `INSERT INTO tickets (id, title, description, status, priority)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [randomUUID(), input.title, input.description ?? null, input.status, input.priority],
  );
  return result.rows[0];
}

export async function listTickets(options: ListOptions): Promise<TicketPage> {
  const offset = (options.page - 1) * options.limit;
  const result = await pool.query<{ items: Ticket[]; total: number }>(
    `WITH filtered AS (
       SELECT * FROM tickets WHERE ($1::ticket_status IS NULL OR status = $1)
     ), paged AS (
       SELECT * FROM filtered ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3
     )
     SELECT COALESCE(
       (SELECT json_agg(paged ORDER BY created_at DESC, id DESC) FROM paged), '[]'::json
     ) AS items, (SELECT count(*)::int FROM filtered) AS total`,
    [options.status ?? null, options.limit, offset],
  );
  return { ...result.rows[0], page: options.page, limit: options.limit };
}
