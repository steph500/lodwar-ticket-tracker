BEGIN;

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX tickets_created_at_idx ON tickets (created_at DESC, id DESC);

COMMIT;
