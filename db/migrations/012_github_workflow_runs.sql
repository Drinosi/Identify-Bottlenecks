ALTER TABLE github_pull_requests
ADD COLUMN IF NOT EXISTS merge_commit_sha TEXT;

ALTER TABLE github_repositories
ADD COLUMN IF NOT EXISTS last_workflow_run_synced_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS workflow_run_sync_status TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS workflow_run_sync_error TEXT;

CREATE TABLE IF NOT EXISTS github_workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repository_id UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
    github_workflow_run_id BIGINT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    conclusion TEXT,
    event TEXT NOT NULL,
    head_branch TEXT NOT NULL,
    head_sha TEXT NOT NULL,
    html_url TEXT,
    run_started_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    UNIQUE (github_repository_id, github_workflow_run_id)
);

CREATE INDEX IF NOT EXISTS github_workflow_runs_repository_id_idx
    ON github_workflow_runs (github_repository_id);

CREATE INDEX IF NOT EXISTS github_workflow_runs_head_sha_idx
    ON github_workflow_runs (head_sha);

CREATE INDEX IF NOT EXISTS github_workflow_runs_run_started_at_idx
    ON github_workflow_runs (run_started_at);
