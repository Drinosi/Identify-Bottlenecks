import { db } from '@/lib/db'
import {
  resolveMetricThresholds,
  type MetricThresholdOverrides,
} from '@/lib/metricThresholds'

type WorkspaceUser = {
  id: string
  name: string
  email: string
}

export async function getWorkspaceForUser(user: WorkspaceUser) {
  const organizationResult = await db.query(
    `
    SELECT
      organizations.id,
      organizations.name,
      organizations.slug,
      organizations.created_at,
      organization_members.role
    FROM organization_members
    INNER JOIN organizations
      ON organizations.id = organization_members.organization_id
    WHERE organization_members.user_id = $1
    ORDER BY organization_members.created_at ASC
    LIMIT 1
    `,
    [user.id]
  )

  const organization = organizationResult.rows[0]

  if (!organization) {
    return {
      user,
      organization: null,
      metricThresholds: resolveMetricThresholds(),
      members: [],
      invitations: [],
      github: {
        connected: false,
        accountLogin: null,
        installationId: null,
        lastRepositorySyncedAt: null,
        repositorySyncStatus: 'idle',
        repositorySyncError: null,
        repositories: [],
        pullRequests: {
          total: 0,
          waitingForReview: 0,
          oldestWaitingReviewHours: null,
          oldestWaitingReviewRepositoryFullName: null,
          reviewedButUnmerged: 0,
          oldestReviewedButUnmergedHours: null,
          oldestReviewedButUnmergedRepositoryFullName: null,
          averageHoursToFirstReview: null,
          averageHoursToMerge: null,
        },
        pipeline: {
          successfulRunsLast30Days: 0,
          successRateLast30Days: null,
          medianHoursMergeToPipeline: null,
          baselineMedianHoursMergeToPipeline: null,
          medianHoursMergeToPipelinePercentChange: null,
        },
      },
    }
  }

  const thresholdResult = await db.query(
    `
    SELECT *
    FROM organization_metric_thresholds
    WHERE organization_id = $1
    LIMIT 1
    `,
    [organization.id]
  )
  const metricThresholds = resolveMetricThresholds(
    thresholdResult.rows[0] as MetricThresholdOverrides | undefined
  )

  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

  const membersResult = await db.query(
    `
    SELECT
      organization_members.id,
      "user".name,
      "user".email,
      organization_members.role
    FROM organization_members
    INNER JOIN "user"
      ON "user".id = organization_members.user_id
    WHERE organization_members.organization_id = $1
    ORDER BY organization_members.created_at ASC
    `,
    [organization.id]
  )

  const invitationsResult = await db.query(
    `
    SELECT
      id,
      email,
      role,
      expires_at,
      token
    FROM organization_invitations
    WHERE organization_id = $1
      AND accepted_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    `,
    [organization.id]
  )

  const githubResult = await db.query(
    `
    SELECT
      id,
      account_login,
      installation_id,
      last_repository_synced_at,
      repository_sync_status,
      repository_sync_error
    FROM github_installations
    WHERE organization_id = $1
    LIMIT 1
    `,
    [organization.id]
  )
  const githubInstallation = githubResult.rows[0]

  const repositoriesResult = githubInstallation
    ? await db.query(
        `
        SELECT
          id,
          owner,
          name,
          full_name,
          default_branch,
          private,
          last_pull_request_synced_at,
          pull_request_sync_status,
          pull_request_sync_error,
          last_workflow_run_synced_at,
          workflow_run_sync_status,
          workflow_run_sync_error,
          last_commit_synced_at,
          commit_sync_status,
          commit_sync_error,
          updated_at
        FROM github_repositories
        WHERE github_installation_id = $1
        ORDER BY full_name ASC
        `,
        [githubInstallation.id]
      )
    : { rows: [] }

  const pullRequestMetricsResult = githubInstallation
    ? await db.query(
        `
        SELECT
          COUNT(*)::INT AS total_pull_requests,
          COUNT(*) FILTER (
            WHERE state = 'open'
              AND first_reviewed_at IS NULL
          )::INT AS waiting_for_review,
          ROUND(
            MAX(
              EXTRACT(EPOCH FROM (NOW() - opened_at)) / 3600
            ) FILTER (
              WHERE state = 'open'
                AND first_reviewed_at IS NULL
            ),
            1
          ) AS oldest_waiting_review_hours,
          (
            SELECT github_repositories.full_name
            FROM github_pull_requests oldest_waiting_pr
            INNER JOIN github_repositories
              ON github_repositories.id = oldest_waiting_pr.github_repository_id
            WHERE github_repositories.github_installation_id = $1
              AND oldest_waiting_pr.state = 'open'
              AND oldest_waiting_pr.first_reviewed_at IS NULL
            ORDER BY oldest_waiting_pr.opened_at ASC
            LIMIT 1
          ) AS oldest_waiting_review_repository_full_name,
          COUNT(*) FILTER (
            WHERE state = 'open'
              AND first_reviewed_at IS NOT NULL
              AND merged_at IS NULL
          )::INT AS reviewed_but_unmerged,
          ROUND(
            MAX(
              EXTRACT(EPOCH FROM (NOW() - first_reviewed_at)) / 3600
            ) FILTER (
              WHERE state = 'open'
                AND first_reviewed_at IS NOT NULL
                AND merged_at IS NULL
            ),
            1
          ) AS oldest_reviewed_but_unmerged_hours,
          (
            SELECT github_repositories.full_name
            FROM github_pull_requests oldest_reviewed_pr
            INNER JOIN github_repositories
              ON github_repositories.id = oldest_reviewed_pr.github_repository_id
            WHERE github_repositories.github_installation_id = $1
              AND oldest_reviewed_pr.state = 'open'
              AND oldest_reviewed_pr.first_reviewed_at IS NOT NULL
              AND oldest_reviewed_pr.merged_at IS NULL
            ORDER BY oldest_reviewed_pr.first_reviewed_at ASC
            LIMIT 1
          ) AS oldest_reviewed_but_unmerged_repository_full_name,
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (first_reviewed_at - opened_at)) / 3600
            ) FILTER (WHERE first_reviewed_at IS NOT NULL),
            1
          ) AS average_hours_to_first_review,
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (merged_at - opened_at)) / 3600
            ) FILTER (WHERE merged_at IS NOT NULL),
            1
          ) AS average_hours_to_merge
        FROM github_pull_requests
        INNER JOIN github_repositories
          ON github_repositories.id = github_pull_requests.github_repository_id
        WHERE github_repositories.github_installation_id = $1
        `,
        [githubInstallation.id]
      )
    : { rows: [] }
  const pullRequestMetrics = pullRequestMetricsResult.rows[0]

  const pipelineMetricsResult = githubInstallation
    ? await db.query(
        `
        WITH repository_runs AS (
          SELECT
            github_workflow_runs.conclusion,
            github_workflow_runs.run_started_at
          FROM github_workflow_runs
          INNER JOIN github_repositories
            ON github_repositories.id = github_workflow_runs.github_repository_id
          WHERE github_repositories.github_installation_id = $1
            AND github_workflow_runs.run_started_at >= NOW() - INTERVAL '30 days'
        ),
        first_successful_runs AS (
          SELECT
            github_workflow_runs.github_repository_id,
            github_workflow_runs.head_sha,
            MIN(github_workflow_runs.run_started_at) AS first_successful_run_at
          FROM github_workflow_runs
          INNER JOIN github_repositories
            ON github_repositories.id = github_workflow_runs.github_repository_id
          WHERE github_repositories.github_installation_id = $1
            AND github_workflow_runs.conclusion = 'success'
            AND github_workflow_runs.run_started_at IS NOT NULL
          GROUP BY
            github_workflow_runs.github_repository_id,
            github_workflow_runs.head_sha
        )
        SELECT
          (
            SELECT COUNT(*) FILTER (
              WHERE repository_runs.conclusion = 'success'
            )::INT
            FROM repository_runs
          ) AS successful_runs_last_30_days,
          (
            SELECT ROUND(
              (
                COUNT(*) FILTER (
                  WHERE repository_runs.conclusion = 'success'
                )::NUMERIC
                /
                NULLIF(COUNT(*), 0)::NUMERIC
              ) * 100,
              1
            )
            FROM repository_runs
          ) AS success_rate_last_30_days,
          (
            SELECT ROUND(
              (
                percentile_cont(0.5) WITHIN GROUP (
                  ORDER BY EXTRACT(EPOCH FROM (
                    first_successful_runs.first_successful_run_at - github_pull_requests.merged_at
                  )) / 3600
                )
              )::NUMERIC,
              1
            )
            FROM github_pull_requests
            INNER JOIN github_repositories
              ON github_repositories.id = github_pull_requests.github_repository_id
            LEFT JOIN first_successful_runs
              ON first_successful_runs.github_repository_id = github_pull_requests.github_repository_id
              AND first_successful_runs.head_sha = github_pull_requests.merge_commit_sha
            WHERE github_repositories.github_installation_id = $1
          ) AS median_hours_merge_to_pipeline,
          (
            SELECT ROUND(
              AVG(latest_baseline.median_merge_to_pipeline_hours)::NUMERIC,
              1
            )
            FROM (
              SELECT DISTINCT ON (github_repository_id)
                github_repository_id,
                metric_date,
                median_merge_to_pipeline_hours
              FROM github_repository_pipeline_daily_metrics
              WHERE median_merge_to_pipeline_hours IS NOT NULL
              ORDER BY github_repository_id, metric_date DESC
            ) latest_daily
            INNER JOIN LATERAL (
              SELECT
                AVG(baseline.median_merge_to_pipeline_hours) AS median_merge_to_pipeline_hours
              FROM github_repository_pipeline_daily_metrics baseline
              WHERE baseline.github_repository_id = latest_daily.github_repository_id
                AND baseline.metric_date < latest_daily.metric_date
                AND baseline.metric_date >= latest_daily.metric_date - INTERVAL '14 days'
                AND baseline.median_merge_to_pipeline_hours IS NOT NULL
            ) latest_baseline ON TRUE
          ) AS baseline_median_hours_merge_to_pipeline,
          (
            SELECT ROUND(
              AVG(latest_delta.percent_change)::NUMERIC,
              1
            )
            FROM (
              SELECT
                latest_daily.github_repository_id,
                CASE
                  WHEN latest_baseline.baseline_value IS NULL
                    OR latest_baseline.baseline_value = 0
                    OR latest_daily.median_merge_to_pipeline_hours IS NULL
                  THEN NULL
                  ELSE (
                    (
                      latest_daily.median_merge_to_pipeline_hours
                      - latest_baseline.baseline_value
                    ) / latest_baseline.baseline_value
                  ) * 100
                END AS percent_change
              FROM (
                SELECT DISTINCT ON (github_repository_id)
                  github_repository_id,
                  metric_date,
                  median_merge_to_pipeline_hours
                FROM github_repository_pipeline_daily_metrics
                WHERE median_merge_to_pipeline_hours IS NOT NULL
                ORDER BY github_repository_id, metric_date DESC
              ) latest_daily
              INNER JOIN LATERAL (
                SELECT
                  AVG(baseline.median_merge_to_pipeline_hours) AS baseline_value
                FROM github_repository_pipeline_daily_metrics baseline
                WHERE baseline.github_repository_id = latest_daily.github_repository_id
                  AND baseline.metric_date < latest_daily.metric_date
                  AND baseline.metric_date >= latest_daily.metric_date - INTERVAL '14 days'
                  AND baseline.median_merge_to_pipeline_hours IS NOT NULL
              ) latest_baseline ON TRUE
            ) latest_delta
          ) AS median_hours_merge_to_pipeline_percent_change
        `,
        [githubInstallation.id]
      )
    : { rows: [] }
  const pipelineMetrics = pipelineMetricsResult.rows[0]

  return {
    user,
    organization,
    metricThresholds,
    members: membersResult.rows,
    invitations: invitationsResult.rows.map((invite) => ({
      ...invite,
      invite_url: `${baseUrl}/join?invite=${invite.token}`,
    })),
    github: {
      connected: Boolean(githubInstallation),
      accountLogin: githubInstallation?.account_login ?? null,
      installationId: githubInstallation?.installation_id
        ? String(githubInstallation.installation_id)
        : null,
      lastRepositorySyncedAt:
        githubInstallation?.last_repository_synced_at ?? null,
      repositorySyncStatus:
        githubInstallation?.repository_sync_status ?? 'idle',
      repositorySyncError: githubInstallation?.repository_sync_error ?? null,
      repositories: repositoriesResult.rows,
      pullRequests: {
        total: pullRequestMetrics?.total_pull_requests ?? 0,
        waitingForReview: pullRequestMetrics?.waiting_for_review ?? 0,
        oldestWaitingReviewHours:
          pullRequestMetrics?.oldest_waiting_review_hours === null
            ? null
            : Number(pullRequestMetrics?.oldest_waiting_review_hours ?? 0),
        oldestWaitingReviewRepositoryFullName:
          pullRequestMetrics?.oldest_waiting_review_repository_full_name ??
          null,
        reviewedButUnmerged: pullRequestMetrics?.reviewed_but_unmerged ?? 0,
        oldestReviewedButUnmergedHours:
          pullRequestMetrics?.oldest_reviewed_but_unmerged_hours === null
            ? null
            : Number(
                pullRequestMetrics?.oldest_reviewed_but_unmerged_hours ?? 0
              ),
        oldestReviewedButUnmergedRepositoryFullName:
          pullRequestMetrics?.oldest_reviewed_but_unmerged_repository_full_name ??
          null,
        averageHoursToFirstReview:
          pullRequestMetrics?.average_hours_to_first_review === null
            ? null
            : Number(pullRequestMetrics?.average_hours_to_first_review ?? 0),
        averageHoursToMerge:
          pullRequestMetrics?.average_hours_to_merge === null
            ? null
            : Number(pullRequestMetrics?.average_hours_to_merge ?? 0),
      },
      pipeline: {
        successfulRunsLast30Days:
          pipelineMetrics?.successful_runs_last_30_days ?? 0,
        successRateLast30Days:
          pipelineMetrics?.success_rate_last_30_days === null
            ? null
            : Number(pipelineMetrics?.success_rate_last_30_days ?? 0),
        medianHoursMergeToPipeline:
          pipelineMetrics?.median_hours_merge_to_pipeline === null
            ? null
            : Number(pipelineMetrics?.median_hours_merge_to_pipeline ?? 0),
        baselineMedianHoursMergeToPipeline:
          pipelineMetrics?.baseline_median_hours_merge_to_pipeline === null
            ? null
            : Number(
                pipelineMetrics?.baseline_median_hours_merge_to_pipeline ?? 0
              ),
        medianHoursMergeToPipelinePercentChange:
          pipelineMetrics?.median_hours_merge_to_pipeline_percent_change ===
          null
            ? null
            : Number(
                pipelineMetrics?.median_hours_merge_to_pipeline_percent_change ??
                  0
              ),
      },
    },
  }
}
