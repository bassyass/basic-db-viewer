-- Create a strictly read-only role for basic-db-viewer.
-- Run this once as a superuser (or the database owner), then use this
-- role in the viewer's DATABASE_URL. This is the most important safety
-- layer: even if every other guard failed, PostgreSQL itself would
-- refuse any write from this role.
--
-- Replace the password and, if needed, the schema name below.

CREATE ROLE dbviewer_readonly LOGIN PASSWORD 'CHANGE_ME';

GRANT CONNECT ON DATABASE your_database TO dbviewer_readonly;
GRANT USAGE ON SCHEMA public TO dbviewer_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dbviewer_readonly;

-- Also cover tables created in the future:
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dbviewer_readonly;
