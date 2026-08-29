ALTER TABLE github_repositories
ADD COLUMN IF NOT EXISTS last_commit_synced_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS commit_sync_status TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS commit_sync_error TEXT;

CREATE TABLE IF NOT EXISTS repository_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repository_id UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    sha TEXT NOT NULL,
    author_identity_id UUID REFERENCES integration_identities(id) ON DELETE SET NULL,
    author_name TEXT,
    author_email TEXT,
    message TEXT NOT NULL,
    committed_at TIMESTAMP NOT NULL,
    html_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (provider, external_id),
    UNIQUE (github_repository_id, sha)
);

CREATE INDEX IF NOT EXISTS repository_commits_repository_id_idx
    ON repository_commits (github_repository_id);

CREATE INDEX IF NOT EXISTS repository_commits_author_identity_id_idx
    ON repository_commits (author_identity_id);

CREATE INDEX IF NOT EXISTS repository_commits_committed_at_idx
    ON repository_commits (committed_at);
