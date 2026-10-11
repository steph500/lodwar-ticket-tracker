import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TicketForm } from '../components/ticket-form/ticket-form';
import { TicketList } from '../components/ticket-list/ticket-list';
import { TicketDetails } from '../components/ticket-details/ticket-details';
import { TicketPanel } from '../components/ticket-panel/ticket-panel';
import {
  NewTicket,
  Ticket,
  TicketPage,
  TicketPriority,
  TicketStats,
  TicketStatus,
} from '../ticket.model';
import { TicketService } from '../ticket.service';

@Component({
  selector: 'app-tickets-page',
  imports: [FormsModule, TicketForm, TicketList, TicketDetails, TicketPanel],
  templateUrl: './tickets-page.html',
  styleUrl: './tickets-page.css',
})
export class TicketsPage implements OnInit {
  private readonly service = inject(TicketService);
  readonly data = signal<TicketPage>({ items: [], total: 0, page: 1, limit: 10 });
  readonly stats = signal<TicketStats>({ open: 0, in_progress: 0, closed: 0 });
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly creating = signal(false);
  readonly selected = signal<Ticket | null>(null);
  status: TicketStatus | '' = '';
  page = 1;
  limit = 10;
  private requestVersion = 0;

  ngOnInit(): void {
    this.refresh();
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.data().total / this.limit));
  }
  get firstItem(): number {
    return this.data().total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get lastItem(): number {
    return Math.min(this.page * this.limit, this.data().total);
  }

  load(): void {
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set('');
    this.service.list(this.status, this.page, this.limit).subscribe({
      next: (data) => {
        if (version !== this.requestVersion) return;
        if (!data.items.length && data.total > 0 && this.page > 1) {
          this.page = Math.max(1, Math.ceil(data.total / this.limit));
          this.load();
          return;
        }
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        if (version === this.requestVersion) {
          this.fail(error);
          this.loading.set(false);
        }
      },
    });
  }

  refresh(): void {
    this.load();
    this.service
      .stats()
      .subscribe({ next: (stats) => this.stats.set(stats), error: (error) => this.fail(error) });
  }

  filter(): void {
    this.page = 1;
    this.load();
  }
  goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  create(input: NewTicket): void {
    this.saving.set(true);
    this.error.set('');
    this.service.create(input).subscribe({
      next: () => {
        this.saving.set(false);
        this.creating.set(false);
        this.status = '';
        this.page = 1;
        this.notice.set('Ticket created successfully.');
        this.refresh();
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(error);
      },
    });
  }

  update(ticket: Ticket, changes: { status?: TicketStatus; priority?: TicketPriority }): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    this.service.update(ticket.id, changes).subscribe({
      next: (updated) => {
        if (this.selected()?.id === updated.id) this.selected.set(updated);
        this.saving.set(false);
        this.notice.set('Ticket updated successfully.');
        this.refresh();
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(error);
      },
    });
  }

  private fail(error: HttpErrorResponse): void {
    const message = error.error?.error;
    this.error.set(
      typeof message === 'string'
        ? message
        : 'Could not connect to the API. Please try again in a moment.',
    );
  }
}
