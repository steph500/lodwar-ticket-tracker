import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewTicket, TicketPriority } from '../../ticket.model';

@Component({
  selector: 'app-ticket-form', imports: [FormsModule],
  templateUrl: './ticket-form.html', styleUrl: './ticket-form.css',
})
export class TicketForm {
  readonly saving = input(false);
  readonly created = output<NewTicket>();
  readonly cancelled = output<void>();
  title = '';
  description = '';
  priority: TicketPriority = 'medium';

  submit(): void {
    if (!this.title.trim() || this.saving()) return;
    this.created.emit({ title: this.title.trim(), description: this.description, priority: this.priority });
  }
}
