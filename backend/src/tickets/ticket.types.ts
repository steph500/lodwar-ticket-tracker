export const statuses = ['open', 'in_progress', 'closed'] as const;
export const priorities = ['low', 'medium', 'high'] as const;
export type TicketStatus = typeof statuses[number];
export type TicketPriority = typeof priorities[number];

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: Date;
}

export interface CreateTicket {
  title: string;
  description?: string | null;
  status?: TicketStatus;
  priority: TicketPriority;
}

export interface ListOptions {
  status?: TicketStatus;
  page: number;
  limit: number;
}

export interface TicketPage {
  items: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export type TicketChanges = Partial<Pick<Ticket, 'status' | 'priority'>>;
export type TicketStats = Record<TicketStatus, number>;
