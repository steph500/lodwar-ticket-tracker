import { Component, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Ticket, statusLabels } from '../../ticket.model';

@Component({
  selector: 'app-ticket-list', imports: [DatePipe, TitleCasePipe],
  templateUrl: './ticket-list.html', styleUrl: './ticket-list.css',
})
export class TicketList {
  readonly tickets = input.required<Ticket[]>();
  readonly labels = statusLabels;
}
