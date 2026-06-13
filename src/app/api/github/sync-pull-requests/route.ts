import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  fetchPullRequestReviews,
  fetchRepositoryPullRequests,
} from '@/lib/github'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const repositoryId =
    typeof body?.repositoryId === 'string' ? body.repositoryId : null

  const repositoriesResult = await db.query(
    `
    SELECT
      github_installations.installation_id,
      github_repositories.id,
      github_repositories.owner,
      github_repositories.name
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
    [session.user.id, repositoryId]
  )

  if (!repositoriesResult.rows.length) {
    return NextResponse.json(
      {
        error: repositoryId
          ? 'Repository not found'
          : 'Sync repositories before syncing pull requests',
      },
      { status: 404 }
    )
  }

  const client = await db.connect()
  let synced = 0
  const repositoryIds = repositoriesResult.rows.map((repository) => repository.id)

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

    for (const repository of repositoriesResult.rows) {
      const pullRequests = await fetchRepositoryPullRequests(
        repository.installation_id,
        repository.owner,
        repository.name
      )

      for (const pullRequest of pullRequests) {
        const reviews = await fetchPullRequestReviews(
          repository.installation_id,
          repository.owner,
          repository.name,
          pullRequest.number
        )
        const submittedReviews = reviews.filter((review) => review.submitted_at)
        const firstReviewedAt =
          submittedReviews.map((review) => review.submitted_at).sort()[0] ??
          null

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
            pullRequest.id,
            pullRequest.number,
            pullRequest.title,
            pullRequest.state,
            pullRequest.user?.login ?? null,
            pullRequest.draft,
            pullRequest.created_at,
            pullRequest.closed_at,
            pullRequest.merged_at,
            firstReviewedAt,
            submittedReviews.length,
          ]
        )

        synced += 1
      }

      await client.query(
        `
        UPDATE github_repositories
        SET
          last_pull_request_synced_at = NOW(),
          pull_request_sync_status = 'idle',
          pull_request_sync_error = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [repository.id]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({ synced })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
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

    return NextResponse.json(
      { error: 'Failed to sync pull requests' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
