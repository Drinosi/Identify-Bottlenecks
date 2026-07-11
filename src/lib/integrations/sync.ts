import { db } from '@/lib/db'
import { getIntegrationProvider } from '@/lib/integrations/getIntegrationProvider'
import type { IntegrationConnection } from '@/lib/integrations/types'

type SyncRepositoriesResult = {
  synced: number
}

type SyncPullRequestsResult = {
  synced: number
}

type SyncWorkflowRunsResult = {
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
            merge_commit_sha,
            first_reviewed_at,
            review_count,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT (github_pull_request_id)
          DO UPDATE SET
            title = EXCLUDED.title,
            state = EXCLUDED.state,
            author_login = EXCLUDED.author_login,
            draft = EXCLUDED.draft,
            closed_at = EXCLUDED.closed_at,
            merged_at = EXCLUDED.merged_at,
            merge_commit_sha = EXCLUDED.merge_commit_sha,
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
            pullRequest.mergeCommitSha,
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

export async function syncWorkflowRunsForUser(
  userId: string,
  repositoryId: string | null
): Promise<SyncWorkflowRunsResult> {
  const repositoriesResult = await db.query(
    `
    SELECT
      github_installations.installation_id,
      github_repositories.id,
      github_repositories.owner,
      github_repositories.name,
      github_repositories.default_branch AS "defaultBranch",
      github_repositories.last_workflow_run_synced_at
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
        : 'Sync repositories before syncing pipeline runs',
      404
    )
  }

  const provider = getIntegrationProvider('github')
  const client = await db.connect()
  const repositoryIds = repositoriesResult.rows.map(
    (repository) => repository.id
  )
  const syncStartedAt = new Date()
  let synced = 0
  let transactionStarted = false

  try {
    await db.query(
      `
      UPDATE github_repositories
      SET
        workflow_run_sync_status = 'syncing',
        workflow_run_sync_error = NULL,
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
      const workflowRuns = await provider.listWorkflowRuns(
        connection,
        repository,
        { updatedSince: repository.last_workflow_run_synced_at }
      )

      for (const workflowRun of workflowRuns) {
        await client.query(
          `
          INSERT INTO github_workflow_runs (
            github_repository_id,
            github_workflow_run_id,
            name,
            status,
            conclusion,
            event,
            head_branch,
            head_sha,
            html_url,
            run_started_at,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (github_workflow_run_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            conclusion = EXCLUDED.conclusion,
            event = EXCLUDED.event,
            head_branch = EXCLUDED.head_branch,
            head_sha = EXCLUDED.head_sha,
            html_url = EXCLUDED.html_url,
            run_started_at = EXCLUDED.run_started_at,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
          `,
          [
            repository.id,
            workflowRun.externalId,
            workflowRun.name,
            workflowRun.status,
            workflowRun.conclusion,
            workflowRun.event,
            workflowRun.headBranch,
            workflowRun.headSha,
            workflowRun.htmlUrl,
            workflowRun.runStartedAt,
            workflowRun.createdAt,
            workflowRun.updatedAt,
          ]
        )

        synced += 1
      }

      await client.query(
        `
        UPDATE github_repositories
        SET
          last_workflow_run_synced_at = $2,
          workflow_run_sync_status = 'idle',
          workflow_run_sync_error = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [repository.id, syncStartedAt]
      )

      await refreshRepositoryPipelineDailyMetrics(client, repository.id)
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
        workflow_run_sync_status = 'failed',
        workflow_run_sync_error = $1,
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

async function refreshRepositoryPipelineDailyMetrics(
  client: { query: (sql: string, values?: unknown[]) => Promise<unknown> },
  repositoryId: string
) {
  await client.query(
    `
    DELETE FROM github_repository_pipeline_daily_metrics
    WHERE github_repository_id = $1
    `,
    [repositoryId]
  )

  await client.query(
    `
    WITH first_successful_runs AS (
      SELECT
        head_sha,
        MIN(run_started_at) AS first_successful_run_at
      FROM github_workflow_runs
      WHERE github_repository_id = $1
        AND conclusion = 'success'
        AND run_started_at IS NOT NULL
      GROUP BY head_sha
    ),
    merge_to_pipeline_daily AS (
      SELECT
        DATE(first_successful_runs.first_successful_run_at) AS metric_date,
        EXTRACT(EPOCH FROM (
          first_successful_runs.first_successful_run_at - github_pull_requests.merged_at
        )) / 3600 AS merge_to_pipeline_hours
      FROM github_pull_requests
      INNER JOIN first_successful_runs
        ON first_successful_runs.head_sha = github_pull_requests.merge_commit_sha
      WHERE github_pull_requests.github_repository_id = $1
        AND github_pull_requests.merged_at IS NOT NULL
    ),
    workflow_run_daily AS (
      SELECT
        DATE(run_started_at) AS metric_date,
        COUNT(*) FILTER (WHERE conclusion = 'success')::INT AS successful_runs_count,
        COUNT(*) FILTER (
          WHERE conclusion IS NOT NULL
            AND conclusion <> 'success'
        )::INT AS failed_runs_count
      FROM github_workflow_runs
      WHERE github_repository_id = $1
        AND run_started_at IS NOT NULL
      GROUP BY DATE(run_started_at)
    ),
    metric_dates AS (
      SELECT metric_date FROM workflow_run_daily
      UNION
      SELECT metric_date FROM merge_to_pipeline_daily
    )
    INSERT INTO github_repository_pipeline_daily_metrics (
      github_repository_id,
      metric_date,
      successful_runs_count,
      failed_runs_count,
      average_merge_to_pipeline_hours,
      median_merge_to_pipeline_hours,
      created_at,
      updated_at
    )
    SELECT
      $1,
      metric_dates.metric_date,
      COALESCE(workflow_run_daily.successful_runs_count, 0),
      COALESCE(workflow_run_daily.failed_runs_count, 0),
      ROUND(AVG(merge_to_pipeline_daily.merge_to_pipeline_hours)::NUMERIC, 1),
      ROUND(
        percentile_cont(0.5) WITHIN GROUP (
          ORDER BY merge_to_pipeline_daily.merge_to_pipeline_hours
        )::NUMERIC,
        1
      ),
      NOW(),
      NOW()
    FROM metric_dates
    LEFT JOIN workflow_run_daily
      ON workflow_run_daily.metric_date = metric_dates.metric_date
    LEFT JOIN merge_to_pipeline_daily
      ON merge_to_pipeline_daily.metric_date = metric_dates.metric_date
    GROUP BY
      metric_dates.metric_date,
      workflow_run_daily.successful_runs_count,
      workflow_run_daily.failed_runs_count
    `,
    [repositoryId]
  )
}
