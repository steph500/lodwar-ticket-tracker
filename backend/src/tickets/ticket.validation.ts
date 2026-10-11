import {
  CreateTicket,
  ListOptions,
  priorities,
  statuses,
  TicketChanges,
  TicketStatus,
} from "./ticket.types";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function invalid(message: string): never {
  throw new HttpError(400, message);
}

function bodyObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid("Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function validateCreate(value: unknown): CreateTicket {
  const body = bodyObject(value);
  const allowed = ["title", "description", "status", "priority"];
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    invalid("Unknown ticket field.");
  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 255
  ) {
    invalid("Title must contain 1–255 characters.");
  }
  if (!priorities.some((priority) => priority === body.priority))
    invalid("Priority must be low, medium, or high.");
  if (
    body.status !== undefined &&
    !statuses.some((status) => status === body.status)
  )
    invalid("Invalid status.");
  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    invalid("Description must be a string or null.");
  }
  return {
    title: (body.title as string).trim(),
    description:
      typeof body.description === "string"
        ? body.description.trim() || null
        : null,
    status: body.status as TicketStatus | undefined,
    priority: body.priority as CreateTicket["priority"],
  };
}

function positiveInteger(
  value: unknown,
  fallback: number,
  max: number,
): number {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value))
    invalid("Page and limit must be positive integers.");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max)
    invalid(`Pagination value exceeds ${max}.`);
  return number;
}

export function validateList(query: Record<string, unknown>): ListOptions {
  if (
    query.status !== undefined &&
    !statuses.some((status) => status === query.status)
  )
    invalid("Invalid status filter.");
  return {
    status: query.status as TicketStatus | undefined,
    page: positiveInteger(query.page, 1, 1_000_000),
    limit: positiveInteger(query.limit, 10, 100),
  };
}

export function validateId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    invalid("Ticket id must be a UUID.");
  }
  return value as string;
}

export function validateUpdate(value: unknown): TicketChanges {
  const body = bodyObject(value);
  const keys = Object.keys(body);
  if (
    !keys.length ||
    keys.some((key) => key !== "status" && key !== "priority")
  ) {
    invalid("Supply only status and/or priority.");
  }
  if ("status" in body && !statuses.some((status) => status === body.status))
    invalid("Invalid status.");
  if (
    "priority" in body &&
    !priorities.some((priority) => priority === body.priority)
  )
    invalid("Invalid priority.");
  return body as TicketChanges;
}
