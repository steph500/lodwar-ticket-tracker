export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
}
export interface NewTicket { title: string; description: string; priority: TicketPriority; }
export interface TicketPage { items: Ticket[]; total: number; page: number; limit: number; }
export type TicketStats = Record<TicketStatus, number>;
export const statusLabels: Record<TicketStatus, string> = {
  open: 'Open', in_progress: 'In Progress', closed: 'Closed',
};
