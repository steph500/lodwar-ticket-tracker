import * as repository from './ticket.repository';
import { CreateTicket, ListOptions } from './ticket.types';

export function createTicket(input: CreateTicket) {
  return repository.createTicket({ ...input, status: input.status ?? 'open' });
}

export function listTickets(options: ListOptions) {
  return repository.listTickets(options);
}
