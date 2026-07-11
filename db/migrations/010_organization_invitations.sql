CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT NOT NULL UNIQUE,
    invited_by_user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS organization_invitations_organization_id_idx
    ON organization_invitations (organization_id);

CREATE INDEX IF NOT EXISTS organization_invitations_token_idx
    ON organization_invitations (token);

CREATE INDEX IF NOT EXISTS organization_invitations_expires_at_idx
    ON organization_invitations (expires_at);
