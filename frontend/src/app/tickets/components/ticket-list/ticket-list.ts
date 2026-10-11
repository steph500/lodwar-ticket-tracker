import { Component, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Ticket, TicketStatus, statusLabels } from '../../ticket.model';

@Component({
  selector: 'app-ticket-list', imports: [DatePipe, TitleCasePipe],
  templateUrl: './ticket-list.html', styleUrl: './ticket-list.css',
})
export class TicketList {
  readonly tickets = input.required<Ticket[]>();
  readonly disabled = input(false);
  readonly selected = output<Ticket>();
  readonly statusChanged = output<{ ticket: Ticket; status: TicketStatus }>();
  readonly labels = statusLabels;

  changeStatus(ticket: Ticket, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value as TicketStatus;
    // Keep the persisted value visible until the API confirms the update.
    select.value = ticket.status;
    this.statusChanged.emit({ ticket, status });
  }
}
