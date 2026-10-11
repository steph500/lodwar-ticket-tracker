import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NewTicket, Ticket, TicketPage, TicketPriority, TicketStats, TicketStatus } from './ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);

  list(status: TicketStatus | '', page: number, limit: number) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<TicketPage>('/tickets', { params });
  }

  create(ticket: NewTicket) { return this.http.post<Ticket>('/tickets', ticket); }
  update(id: string, changes: { status?: TicketStatus; priority?: TicketPriority }) {
    return this.http.patch<Ticket>(`/tickets/${id}`, changes);
  }
  stats() { return this.http.get<TicketStats>('/tickets/stats'); }
}
