ALTER TABLE github_installations
ADD COLUMN IF NOT EXISTS last_repository_synced_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS repository_sync_status TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS repository_sync_error TEXT;

ALTER TABLE github_repositories
ADD COLUMN IF NOT EXISTS last_pull_request_synced_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS pull_request_sync_status TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS pull_request_sync_error TEXT;
