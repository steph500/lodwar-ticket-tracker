import 'dotenv/config';
import { app } from './app';

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '127.0.0.1', () => {
  console.log(`Ticket API listening on http://localhost:${port}`);
});
