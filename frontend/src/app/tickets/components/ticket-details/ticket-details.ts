import { Component, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketPriority, TicketStatus, statusLabels } from '../../ticket.model';

@Component({
  selector: 'app-ticket-details', imports: [DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './ticket-details.html', styleUrl: './ticket-details.css',
})
export class TicketDetails implements OnChanges {
  readonly ticket = input.required<Ticket>();
  readonly saving = input(false);
  readonly saved = output<{ status: TicketStatus; priority: TicketPriority }>();
  readonly labels = statusLabels;
  status: TicketStatus = 'open';
  priority: TicketPriority = 'medium';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket']) {
      this.status = this.ticket().status;
      this.priority = this.ticket().priority;
    }
  }
  save(): void {
    if (!this.saving()) this.saved.emit({ status: this.status, priority: this.priority });
  }
}
