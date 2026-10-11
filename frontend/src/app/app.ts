import { Component } from '@angular/core';
import { TicketsPage } from './tickets/tickets-page/tickets-page';

@Component({ selector: 'app-root', imports: [TicketsPage], template: '<app-tickets-page />' })
export class App {}
