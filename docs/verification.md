# Verification results

Verified on **11 October 2026 (EAT)** against the local application and real PostgreSQL, not mocked data.

**Story:** A user creates and manages a support ticket through Angular → Express → PostgreSQL, then sees persisted changes and refreshed counts without leaving the main page.

## Environment

| Component | Verified version/location |
| --- | --- |
| Node / npm | 24.19.0 / 12.2.0 |
| Frontend | Angular 22.2.2, localhost:4200 |
| Backend | Express 5, localhost:3000 |
| PostgreSQL | 18.6, local Ubuntu WSL, localhost:5432 |
| Databases | ticket_tracker and ticket_tracker_test |

## Automated verification

`npm test --prefix backend`: **3 passed, 0 failed, 0 skipped**.

- Creation test confirms database persistence, default status, required input validation, restricted updates, and missing-ticket behavior.
- Listing test confirms filtered SQL pagination without duplicated IDs and retains the total when requesting a page beyond the end.
- Statistics test confirms zeroes, grouped counts, and updated counts after a status mutation.

`npm run build --prefix backend`: **passed** (strict TypeScript compilation).

`npm run build --prefix frontend`: **passed** (Angular production compilation, strict template checks, and configured size budgets).

## API verification

| Request | Actual outcome |
| --- | --- |
| POST /tickets | Ticket persisted; status defaults to open |
| GET /tickets | Paginated items and total returned |
| GET /tickets?status=open&page=1&limit=10 | Only open tickets returned |
| PATCH /tickets/:id | Status and priority persisted; original title and creation time retained |
| PATCH with title or invalid status | 400 |
| PATCH with a nonexistent UUID | 404 |
| GET /tickets/stats | Correct grouped counts, including zeroes |

## Browser verification

| Boundary / user action | Result |
| --- | --- |
| Main UI renders | Passed: sidebar, ticket table, badges, filter, pagination |
| Create form → POST → PostgreSQL → list | Passed: new title, description, priority, and date appeared; counts refreshed |
| Create form reset | Passed: success closes/destroys the form |
| Status filter → GET → list | Passed: only matching tickets displayed |
| Next and previous page | Passed: page 1 showed five of six tickets; page 2 showed the remaining ticket |
| Inline dropdown → PATCH → list/counts | Passed: saved status displayed and counts refreshed |
| Update while a status filter is active | Passed: ticket moved out of the filtered list; empty-state count became zero |
| Open details | Passed: full description, UUID, priority, status, and created date displayed |
| Details → PATCH status and priority | Passed: changed status/priority appeared in the panel and table |
| Escape | Passed: native dialog closed |
| Smaller laptop layout | Passed at a 1024px viewport: no page overflow; table scrolls within its container |
| Browser console | No error messages captured in the final browser session |

## Resolved setup issues

Windows application control blocked an unsigned PostgreSQL extension in the official portable runtime. PostgreSQL was installed through Ubuntu's package manager in the existing WSL distribution instead. WSL initially stopped after the setup process exited; a persistent local WSL session keeps the database available. Neither resolution required disabling Windows security or using a hosted database.

Public deployment is complete with an explicitly approved new isolated Neon Free database. Both Git-linked Vercel projects reached READY, and the frontend production domain returned HTTP 200 without authentication. The hosted database connection, all four API endpoints, and browser create/update flows passed. Local API tests (3/3) and both builds also passed after the hosting changes. No assessment requirement depends on deployment.

## Public verification details

Live app: https://lodwar-ticket-tracker.vercel.app.

The new database was verified empty before migration, and its six expected columns were checked. Connection succeeded with TLS certificate verification. Through the frontend domain: POST returned 201 and a persisted open ticket; GET returned the ticket with the requested page size; PATCH saved status and priority; GET /tickets/stats reflected the change. A filtered page beyond the last page retained the total and returned no items. A title update returned 400; a nonexistent UUID returned 404.

The hosted browser flow passed ticket creation, inline status changes, full details display, and status/priority changes in the details panel. Counts refreshed after mutations. Two harmless support tickets remain as demonstration data. No paid plan, Supabase project, hosted authentication, or existing application database was used. The exact three API integration tests remain separate from this manual hosted verification.
