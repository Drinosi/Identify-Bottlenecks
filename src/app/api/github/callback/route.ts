import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchInstallation } from '@/lib/github'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const installationId = url.searchParams.get('installation_id')
  const state = url.searchParams.get('state')

  if (!installationId) {
    return NextResponse.redirect(new URL('/app?github=missing', request.url))
  }

  if (!state) {
    return NextResponse.redirect(
      new URL('/app?github=missing-state', request.url)
    )
  }

  const stateResult = await db.query(
    `
    SELECT
      organization_id
    FROM github_install_states
    WHERE state = $1
      AND expires_at > NOW()
    LIMIT 1
    `,
    [state]
  )

  const installState = stateResult.rows[0]

  if (!installState) {
    return NextResponse.redirect(new URL('/app?github=forbidden', request.url))
  }

  let installation

  try {
    installation = await fetchInstallation(installationId)
  } catch (error) {
    console.error(error)

    return NextResponse.redirect(
      new URL('/app?github=verification-failed', request.url)
    )
  }

  const accountLogin = installation.account?.login
  const accountType = installation.account?.type

  if (!accountLogin || !accountType) {
    return NextResponse.redirect(
      new URL('/app?github=verification-failed', request.url)
    )
  }

  await db.query(
    `
    INSERT INTO github_installations (
      organization_id,
      installation_id,
      account_login,
      account_type,
      updated_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (organization_id)
    DO UPDATE SET
      installation_id = EXCLUDED.installation_id,
      account_login = EXCLUDED.account_login,
      account_type = EXCLUDED.account_type,
      updated_at = NOW()
    `,
    [installState.organization_id, installationId, accountLogin, accountType]
  )

  await db.query(
    `
    DELETE FROM github_install_states
    WHERE state = $1
    `,
    [state]
  )

  return NextResponse.redirect(new URL('/app?github=connected', request.url))
}
