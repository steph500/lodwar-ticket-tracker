import { Request, Response } from 'express';
import * as service from './ticket.service';
import { validateCreate, validateList } from './ticket.validation';

export async function createTicket(req: Request, res: Response): Promise<void> {
  const ticket = await service.createTicket(validateCreate(req.body));
  res.status(201).json(ticket);
}

export async function listTickets(req: Request, res: Response): Promise<void> {
  res.json(await service.listTickets(validateList(req.query)));
}
