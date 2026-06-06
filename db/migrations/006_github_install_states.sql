CREATE TABLE IF NOT EXISTS github_install_states (
    state TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS github_install_states_organization_id_idx
    ON github_install_states (organization_id);

CREATE INDEX IF NOT EXISTS github_install_states_expires_at_idx
    ON github_install_states (expires_at);
