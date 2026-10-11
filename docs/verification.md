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

Optional deployment was omitted because the application requires a working PostgreSQL connection and no hosted database was selected. No assessment requirement depends on deployment.
