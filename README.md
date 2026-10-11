# Lodwar Services Mini Ticket Tracker

A small support-ticket tracker with an Angular single-page interface, an Express REST API, and local PostgreSQL. Create tickets, filter and paginate the list, update status inline, and view full details or edit status and priority in a panel.

## Stack and prerequisites

- Node.js **24.19+ in the 24.x line**, with npm (verified with Node 24.19.0 and npm 12.2.0).
- PostgreSQL **16+**, running locally; PostgreSQL 18.6 was used for verification.
- Git to clone the repository.
- Angular 22, TypeScript, Express 5, and `pg` are installed through the lockfiles. There is no global Angular CLI requirement.

No hosted database, Docker, ORM, authentication provider, or UI library is required. Node compatibility is documented by [Angular](https://angular.dev/reference/versions).

## Fresh local setup

```sh
git clone https://github.com/steph500/lodwar-ticket-tracker.git
cd lodwar-ticket-tracker
```

### 1. Create two local PostgreSQL databases

Start your PostgreSQL service and open an administrator SQL session:

```sh
psql -h localhost -U postgres
```

On Ubuntu/WSL, use `sudo -u postgres psql` instead. Run this SQL once, replacing the example password with your own local password:

```sql
CREATE ROLE ticket_tracker LOGIN PASSWORD 'replace_me';
CREATE DATABASE ticket_tracker OWNER ticket_tracker;
CREATE DATABASE ticket_tracker_test OWNER ticket_tracker;
```

Exit with `\q`. The test database is separate and disposable. The application role owns only these new databases and does not require superuser privileges.

### 2. Configure and migrate the backend

```sh
cd backend
npm ci
cp .env.example .env
```

Edit `backend/.env` to match your PostgreSQL password and port:

```dotenv
DATABASE_URL=postgresql://ticket_tracker:replace_me@localhost:5432/ticket_tracker
TEST_DATABASE_URL=postgresql://ticket_tracker:replace_me@localhost:5432/ticket_tracker_test
PORT=3000
```

Percent-encode special characters in the URL password. `.env` is ignored by Git; never publish it. In Windows PowerShell, `Copy-Item .env.example .env` is equivalent to `cp`.

```sh
npm run db:migrate
npm run dev
```

Run the migration **once per empty development database**. It creates enums, one `tickets` table, and an index in a transaction; rerunning against an existing schema will fail rather than silently modify it. The API listens on [http://localhost:3000](http://localhost:3000).

### 3. Run Angular in another terminal

From the repository root:

```sh
cd frontend
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200). Angular's development proxy forwards `/tickets` and `/tickets/**` to the local API. Keep both terminals and PostgreSQL running. If you change the backend port, also update `frontend/proxy.conf.json`.

### Windows WSL option

The verified Windows setup runs PostgreSQL 18 in an Ubuntu WSL distribution. Install it there with `sudo apt-get update` and `sudo apt-get install postgresql`, then create the role and databases as above. Native Windows PostgreSQL also works if already installed; WSL is optional.

After a reboot, open a PowerShell terminal and keep this command running to keep WSL/PostgreSQL active:

```powershell
wsl -d Ubuntu -u root -- bash -lc 'pg_ctlcluster 18 main start; exec tail -f /dev/null'
```

From the repository root, run the backend and frontend in two additional terminals:

```powershell
npm run dev --prefix backend
```

```powershell
npm start --prefix frontend
```

A fresh database starts empty; no hidden seed step is required. The WSL command assumes PostgreSQL 18's default `main` cluster; check `pg_lsclusters` if you installed another version. WSL is not an application dependency on other operating systems.

## Tests and builds

From the repository root:

```sh
npm test --prefix backend
npm run build --prefix backend
npm run build --prefix frontend
```

Exactly **three** API integration tests use Node's built-in test runner, Supertest, and the actual PostgreSQL connection:

1. Creation, persisted defaults, input validation, and restricted status/priority updates.
2. Status filtering, SQL pagination, totals beyond the last page, and pagination validation.
3. Grouped status counts, zero counts, and counts after a status update.

Tests automatically apply the migration if the test database is empty, truncate its `tickets` table before each test, and clean it afterward. They refuse a database name without the `_test` suffix or one matching the development database name. Never point `TEST_DATABASE_URL` at a database containing data you want to keep. No database mocks are used.

The backend build outputs `backend/dist`; run it with `npm start --prefix backend`. The Angular production files are in `frontend/dist/frontend/browser`. Production hosting would need to serve those files and forward the four API paths to Express; the development proxy is not part of the production bundle.

## API

All responses are JSON. A ticket contains `id`, `title`, nullable `description`, `status`, `priority`, and an ISO `created_at` timestamp. Statuses are `open`, `in_progress`, `closed`; priorities are `low`, `medium`, `high`.

| Method | Endpoint | Input and response |
| --- | --- | --- |
| POST | `/tickets` | Required `title` and `priority`; optional `description` and `status` (defaults to `open`). Returns **201** and the created ticket. |
| GET | `/tickets?status=open&page=1&limit=10` | Status is optional. Defaults: page 1, limit 10; maximum limit 100. Returns `{ items, total, page, limit }`. |
| PATCH | `/tickets/:id` | Only `status` and/or `priority`. Returns the updated ticket or **404** for a missing UUID. |
| GET | `/tickets/stats` | Returns `{ "open": 0, "in_progress": 0, "closed": 0 }` with current counts. |

Example create body:

```json
{ "title": "Cannot log in", "description": "Login returns an error.", "priority": "high" }
```

Example update body:

```json
{ "status": "in_progress", "priority": "medium" }
```

Titles are trimmed and must contain 1–255 characters. Unknown body fields, invalid enum values, malformed UUIDs, empty update bodies, and invalid pagination return **400**. Unknown routes return **404**, oversized JSON bodies return **413**, and unexpected failures return a safe **500** error. Error shape: `{ "error": "message" }`. Pagination is ordered by newest creation timestamp, then UUID to break ties.

## Structure and architecture

```text
backend/
  db/                 SQL migration and migration runner
  src/config/         PostgreSQL connection pool
  src/tickets/        Types, validation, routes, controller, service, repository
  src/middleware/     JSON error handler
  src/app.ts          Express application (also imported by API tests)
  src/server.ts       Local HTTP listener and shutdown
  tests/              Three API integration tests
frontend/
  src/app/tickets/
    components/       Form, table, details, native dialog panel
    tickets-page/     Single-page state and request handling
    ticket.model.ts   Frontend types
    ticket.service.ts HTTP calls
docs/
  architecture.md     System overview, ER diagram, request flow, API contract
  verification.md     Actual verification results
```

See [architecture and ER diagram](docs/architecture.md) and [verification results](docs/verification.md).

## Decisions & Tradeoffs

The implementation is intentionally small to stay within the assessment scope and make each file easy to explain. Express and TypeScript provide a straightforward REST API, while plain `pg` and parameterized SQL avoid an ORM and extra data-access abstractions. PostgreSQL runs locally, with a dedicated application role and a separate disposable test database. Angular uses standalone components, its normal HTTP service, template-driven forms, and plain CSS without a state-management or UI library. The UI follows the supplied layout but stays on one page; the reference's search, priority filter, separate statistics page, and last-updated field were excluded because they are outside the requested model and behavior. Native dialogs handle keyboard focus and Escape, and updates wait for the server response before changing displayed data. Pagination uses one SQL statement to return a consistent total and page, though offset pagination can shift when another client inserts tickets between requests. Three integration tests concentrate on the key database-backed flows rather than exhaustive coverage. Authentication, users, comments, notifications, were excluded; with more time, I would expand failure-path tests, observability, and accessibility testing.

## Deployment

The Angular frontend is deployed at [lodwar-ticket-tracker.vercel.app](https://lodwar-ticket-tracker.vercel.app), and the Express API project is deployed at [lodwar-ticket-tracker-api.vercel.app](https://lodwar-ticket-tracker-api.vercel.app). **Deployment setup is still in progress:** the frontend responds publicly, but ticket operations are unavailable until the separately approved Neon Free database has been provisioned, migrated, and connected. This is not yet a verified working public demo.

Two Git-connected Vercel projects build from `frontend/` and `backend/`. Express exports its existing app for native Vercel hosting; Angular's committed rewrite forwards `/tickets` requests to the API. Local development continues to use the local proxy and PostgreSQL setup above.

To finish the hosted setup, create a new isolated Neon project on its Free plan, run the existing SQL migration once against its empty database, set `DATABASE_URL` as a server-only Secret in the API project's production environment, and redeploy the API. Do not configure `TEST_DATABASE_URL` against the public demo database. Keep database credentials out of source control and the frontend. Validate all four endpoints through the frontend domain and the create/list/update browser flow before treating the deployment as complete.

Neon was approved specifically for this deployment after the initial brief excluded it. No paid plan, Supabase project, or existing production database has been used. Complete local setup and verification remain independent of hosting.
