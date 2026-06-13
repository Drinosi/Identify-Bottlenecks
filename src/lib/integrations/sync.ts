import { db } from '@/lib/db'
import { getIntegrationProvider } from '@/lib/integrations/getIntegrationProvider'
import type { IntegrationConnection } from '@/lib/integrations/types'

type SyncRepositoriesResult = {
  synced: number
}

type SyncPullRequestsResult = {
  synced: number
}

export class IntegrationSyncError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'IntegrationSyncError'
    this.statusCode = statusCode
  }
}

export async function syncRepositoriesForUser(
  userId: string
): Promise<SyncRepositoriesResult> {
  const installationResult = await db.query(
    `
    SELECT
      github_installations.id,
      github_installations.installation_id
    FROM github_installations
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE organization_members.user_id = $1
      AND organization_members.role IN ('owner', 'admin')
    LIMIT 1
    `,
    [userId]
  )

  const installation = installationResult.rows[0]

  if (!installation) {
    throw new IntegrationSyncError(
      'GitHub is not connected for this organization',
      404
    )
  }

  const provider = getIntegrationProvider('github')
  const connection: IntegrationConnection = {
    provider: 'github',
    externalInstallationId: String(installation.installation_id),
  }
  const client = await db.connect()
  let transactionStarted = false

  try {
    await db.query(
      `
      UPDATE github_installations
      SET
        repository_sync_status = 'syncing',
        repository_sync_error = NULL,
        updated_at = NOW()
      WHERE id = $1
      `,
      [installation.id]
    )

    const repositories = await provider.listRepositories(connection)
    const accountLogin = repositories[0]?.accountLogin

    await client.query('BEGIN')
    transactionStarted = true

    await client.query(
      `
      UPDATE github_installations
      SET
        account_login = COALESCE($1, account_login),
        last_repository_synced_at = NOW(),
        repository_sync_status = 'idle',
        repository_sync_error = NULL,
        updated_at = NOW()
      WHERE id = $2
      `,
      [accountLogin ?? null, installation.id]
    )

    for (const repository of repositories) {
      await client.query(
        `
        INSERT INTO github_repositories (
          github_installation_id,
          github_repository_id,
          owner,
          name,
          full_name,
          default_branch,
          private,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (github_repository_id)
        DO UPDATE SET
          owner = EXCLUDED.owner,
          name = EXCLUDED.name,
          full_name = EXCLUDED.full_name,
          default_branch = EXCLUDED.default_branch,
          private = EXCLUDED.private,
          updated_at = NOW()
        `,
        [
          installation.id,
          repository.externalId,
          repository.owner,
          repository.name,
          repository.fullName,
          repository.defaultBranch,
          repository.private,
        ]
      )
    }

    await client.query('COMMIT')

    return { synced: repositories.length }
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK')
    }

    await db.query(
      `
      UPDATE github_installations
      SET
        repository_sync_status = 'failed',
        repository_sync_error = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        error instanceof Error ? error.message : 'Unknown error',
        installation.id,
      ]
    )

    throw error
  } finally {
    client.release()
  }
}

export async function syncPullRequestsForUser(
  userId: string,
  repositoryId: string | null
): Promise<SyncPullRequestsResult> {
  const repositoriesResult = await db.query(
    `
    SELECT
      github_installations.installation_id,
      github_repositories.id,
      github_repositories.owner,
      github_repositories.name,
      github_repositories.last_pull_request_synced_at
    FROM github_repositories
    INNER JOIN github_installations
      ON github_installations.id = github_repositories.github_installation_id
    INNER JOIN organization_members
      ON organization_members.organization_id = github_installations.organization_id
    WHERE organization_members.user_id = $1
      AND organization_members.role IN ('owner', 'admin')
      AND ($2::UUID IS NULL OR github_repositories.id = $2::UUID)
    ORDER BY github_repositories.full_name ASC
    `,
    [userId, repositoryId]
  )

  if (!repositoriesResult.rows.length) {
    throw new IntegrationSyncError(
      repositoryId
        ? 'Repository not found'
        : 'Sync repositories before syncing pull requests',
      404
    )
  }

  const provider = getIntegrationProvider('github')
  const client = await db.connect()
  let synced = 0
  const repositoryIds = repositoriesResult.rows.map(
    (repository) => repository.id
  )
  const syncStartedAt = new Date()
  let transactionStarted = false

  try {
    await db.query(
      `
      UPDATE github_repositories
      SET
        pull_request_sync_status = 'syncing',
        pull_request_sync_error = NULL,
        updated_at = NOW()
      WHERE id = ANY($1::UUID[])
      `,
      [repositoryIds]
    )

    await client.query('BEGIN')
    transactionStarted = true

    for (const repository of repositoriesResult.rows) {
      const connection: IntegrationConnection = {
        provider: 'github',
        externalInstallationId: String(repository.installation_id),
      }
      const pullRequests = await provider.listPullRequests(
        connection,
        repository,
        { updatedSince: repository.last_pull_request_synced_at }
      )

      for (const pullRequest of pullRequests) {
        const reviews = await provider.listPullRequestReviews(
          connection,
          repository,
          pullRequest.number
        )
        const submittedReviewTimes = reviews
          .map((review) => review.submittedAt)
          .filter((submittedAt): submittedAt is string => Boolean(submittedAt))
          .sort()
        const firstReviewedAt = submittedReviewTimes[0] ?? null

        await client.query(
          `
          INSERT INTO github_pull_requests (
            github_repository_id,
            github_pull_request_id,
            number,
            title,
            state,
            author_login,
            draft,
            opened_at,
            closed_at,
            merged_at,
            first_reviewed_at,
            review_count,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (github_pull_request_id)
          DO UPDATE SET
            title = EXCLUDED.title,
            state = EXCLUDED.state,
            author_login = EXCLUDED.author_login,
            draft = EXCLUDED.draft,
            closed_at = EXCLUDED.closed_at,
            merged_at = EXCLUDED.merged_at,
            first_reviewed_at = EXCLUDED.first_reviewed_at,
            review_count = EXCLUDED.review_count,
            updated_at = NOW()
          `,
          [
            repository.id,
            pullRequest.externalId,
            pullRequest.number,
            pullRequest.title,
            pullRequest.state,
            pullRequest.authorLogin,
            pullRequest.draft,
            pullRequest.openedAt,
            pullRequest.closedAt,
            pullRequest.mergedAt,
            firstReviewedAt,
            submittedReviewTimes.length,
          ]
        )

        synced += 1
      }

      await client.query(
        `
        UPDATE github_repositories
        SET
          last_pull_request_synced_at = $2,
          pull_request_sync_status = 'idle',
          pull_request_sync_error = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [repository.id, syncStartedAt]
      )
    }

    await client.query('COMMIT')

    return { synced }
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK')
    }

    await db.query(
      `
      UPDATE github_repositories
      SET
        pull_request_sync_status = 'failed',
        pull_request_sync_error = $1,
        updated_at = NOW()
      WHERE id = ANY($2::UUID[])
      `,
      [error instanceof Error ? error.message : 'Unknown error', repositoryIds]
    )

    throw error
  } finally {
    client.release()
  }
}
