import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

type CreateSignUpIntentInput = {
  email: string
  organizationName?: string | null
  inviteToken?: string | null
}

export async function createSignUpIntent({
  email,
  organizationName,
  inviteToken,
}: CreateSignUpIntentInput) {
  await db.query(
    `
    INSERT INTO sign_up_intents (
      email,
      organization_name,
      invite_token,
      expires_at
    )
    VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
    ON CONFLICT (email)
    DO UPDATE SET
      organization_name = EXCLUDED.organization_name,
      invite_token = EXCLUDED.invite_token,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW()
    `,
    [email.toLowerCase(), organizationName ?? null, inviteToken ?? null]
  )
}

export async function finalizeSignUpIntent(email: string, userId: string) {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const intentResult = await client.query(
      `
      SELECT
        id,
        organization_name,
        invite_token,
        expires_at
      FROM sign_up_intents
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    )

    const intent = intentResult.rows[0]

    if (!intent) {
      await client.query('COMMIT')
      return
    }

    if (new Date(intent.expires_at) <= new Date()) {
      await client.query(
        `
        DELETE FROM sign_up_intents
        WHERE id = $1
        `,
        [intent.id]
      )
      await client.query('COMMIT')
      return
    }

    if (intent.invite_token) {
      const inviteResult = await client.query(
        `
        SELECT
          organization_invitations.id,
          organization_invitations.organization_id,
          organization_invitations.email,
          organization_invitations.role,
          organization_invitations.expires_at
        FROM organization_invitations
        WHERE token = $1
        LIMIT 1
        `,
        [intent.invite_token]
      )

      const invite = inviteResult.rows[0]

      if (
        invite &&
        invite.email.toLowerCase() === email.toLowerCase() &&
        new Date(invite.expires_at) > new Date()
      ) {
        await client.query(
          `
          INSERT INTO organization_members (organization_id, user_id, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (organization_id, user_id)
          DO UPDATE SET role = EXCLUDED.role
          `,
          [invite.organization_id, userId, invite.role]
        )

        await client.query(
          `
          DELETE FROM organization_invitations
          WHERE id = $1
          `,
          [invite.id]
        )
      }
    } else if (intent.organization_name?.trim()) {
      const organizationName = intent.organization_name.trim()
      const slug = createSlug(organizationName)

      const existingMembershipResult = await client.query(
        `
        SELECT 1
        FROM organization_members
        WHERE user_id = $1
        LIMIT 1
        `,
        [userId]
      )

      if (!existingMembershipResult.rows[0]) {
        const uniqueSlug = await generateUniqueSlug(client, slug)
        const organizationResult = await client.query(
          `
          INSERT INTO organizations (name, slug)
          VALUES ($1, $2)
          RETURNING id
          `,
          [organizationName, uniqueSlug]
        )

        await client.query(
          `
          INSERT INTO organization_members (organization_id, user_id, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (organization_id, user_id)
          DO NOTHING
          `,
          [organizationResult.rows[0].id, userId, 'owner']
        )
      }
    }

    await client.query(
      `
      DELETE FROM sign_up_intents
      WHERE id = $1
      `,
      [intent.id]
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

function createSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'organization'
  )
}

async function generateUniqueSlug(
  client: {
    query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }>
  },
  baseSlug: string
) {
  let candidate = baseSlug

  while (true) {
    const result = await client.query(
      `
      SELECT 1
      FROM organizations
      WHERE slug = $1
      LIMIT 1
      `,
      [candidate]
    )

    if (!result.rows[0]) {
      return candidate
    }

    candidate = `${baseSlug}-${randomUUID().slice(0, 8)}`
  }
}
