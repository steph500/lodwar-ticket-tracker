import * as repository from './ticket.repository';
import { CreateTicket, ListOptions, TicketChanges } from './ticket.types';
import { HttpError } from './ticket.validation';

export function createTicket(input: CreateTicket) {
  return repository.createTicket({ ...input, status: input.status ?? 'open' });
}

export function listTickets(options: ListOptions) {
  return repository.listTickets(options);
}

export async function updateTicket(id: string, changes: TicketChanges) {
  const ticket = await repository.updateTicket(id, changes);
  if (!ticket) throw new HttpError(404, 'Ticket not found.');
  return ticket;
}

export function getStats() { return repository.getStats(); }
