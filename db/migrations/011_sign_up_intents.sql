CREATE TABLE IF NOT EXISTS sign_up_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    organization_name TEXT,
    invite_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS sign_up_intents_expires_at_idx
    ON sign_up_intents (expires_at);
