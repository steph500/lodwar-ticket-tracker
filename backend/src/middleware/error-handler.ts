import { ErrorRequestHandler } from 'express';
import { HttpError } from '../tickets/ticket.validation';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  const parsingError = error as { type?: string };
  if (parsingError?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }
  if (parsingError?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body is too large.' });
    return;
  }
  console.error('Ticket request failed:', error);
  res.status(500).json({ error: 'Unable to complete the request.' });
};
