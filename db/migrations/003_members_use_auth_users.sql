ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

ALTER TABLE organization_members
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;
