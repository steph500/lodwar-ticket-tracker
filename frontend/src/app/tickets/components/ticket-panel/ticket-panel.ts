import { AfterViewInit, Component, ElementRef, inject, input, OnDestroy, output, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-ticket-panel', templateUrl: './ticket-panel.html', styleUrl: './ticket-panel.css',
})
export class TicketPanel implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly busy = input(false);
  readonly dismissed = output<void>();
  private readonly panel = viewChild.required<ElementRef<HTMLDialogElement>>('panel');
  private readonly document = inject(DOCUMENT);
  private previousFocus: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previousFocus = this.document.activeElement as HTMLElement | null;
    this.panel().nativeElement.showModal();
  }
  ngOnDestroy(): void {
    this.panel().nativeElement.close();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }
  cancel(event: Event): void {
    event.preventDefault();
    if (!this.busy()) this.dismissed.emit();
  }
}
