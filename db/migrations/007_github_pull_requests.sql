CREATE TABLE IF NOT EXISTS github_pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repository_id UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
    github_pull_request_id BIGINT NOT NULL UNIQUE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    state TEXT NOT NULL,
    author_login TEXT,
    draft BOOLEAN NOT NULL DEFAULT FALSE,
    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,
    merged_at TIMESTAMP,
    first_reviewed_at TIMESTAMP,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (github_repository_id, number)
);

CREATE INDEX IF NOT EXISTS github_pull_requests_repository_id_idx
    ON github_pull_requests (github_repository_id);

CREATE INDEX IF NOT EXISTS github_pull_requests_opened_at_idx
    ON github_pull_requests (opened_at);
