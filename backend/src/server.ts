import 'dotenv/config';
import { app } from './app';
import { pool } from './config/database';

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Ticket API listening on http://localhost:${port}`);
});

function shutdown(): void {
  server.close(() => { void pool.end(); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
