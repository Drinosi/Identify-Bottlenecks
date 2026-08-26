-- This application accesses Postgres only through its server-side connection.
-- Supabase client roles must not be able to bypass the application's
-- authentication and authorization checks through the Data API.

-- Remove privileges inherited through PostgreSQL's built-in PUBLIC role.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

-- Supabase defines anon and authenticated. Keep this migration compatible with
-- plain PostgreSQL development databases where those roles do not exist.
DO $migration$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    END IF;
END
$migration$;

-- Enable RLS as defense in depth. No policies are created because browser/API
-- clients are not intended to access these server-owned tables.
DO $migration$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
            table_record.schemaname,
            table_record.tablename
        );
    END LOOP;
END
$migration$;

-- Secure tables and sequences created by later migrations. These defaults
-- apply to objects created by the role that runs this migration.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC;

DO $migration$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
            'REVOKE ALL PRIVILEGES ON TABLES FROM anon';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
            'REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
            'REVOKE ALL PRIVILEGES ON TABLES FROM authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
            'REVOKE ALL PRIVILEGES ON SEQUENCES FROM authenticated';
    END IF;
END
$migration$;
