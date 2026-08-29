CREATE TABLE IF NOT EXISTS integration_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    login TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    profile_url TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (organization_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS integration_identities_organization_id_idx
    ON integration_identities (organization_id);

CREATE INDEX IF NOT EXISTS integration_identities_provider_login_idx
    ON integration_identities (provider, login);

ALTER TABLE github_pull_requests
ADD COLUMN IF NOT EXISTS author_identity_id UUID
    REFERENCES integration_identities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS github_pull_requests_author_identity_id_idx
    ON github_pull_requests (author_identity_id);
