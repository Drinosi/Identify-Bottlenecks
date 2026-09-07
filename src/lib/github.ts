import { createSign } from 'crypto'

export type GitHubRepository = {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  owner: {
    login: string
  }
}

type InstallationRepositoriesResponse = {
  repositories: GitHubRepository[]
}

export type GitHubPullRequest = {
  id: number
  number: number
  title: string
  state: string
  draft: boolean
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  merge_commit_sha: string | null
  user: {
    id: number
    login: string
    avatar_url: string | null
    html_url: string | null
  } | null
}

export type GitHubPullRequestReview = {
  id: number
  state: string
  submitted_at: string | null
}

export type GitHubInstallation = {
  id: number
  account: {
    login: string
    type: string
  } | null
}

export type GitHubWorkflowRun = {
  id: number
  name: string
  status: string
  conclusion: string | null
  event: string
  head_branch: string
  head_sha: string
  html_url: string | null
  run_started_at: string | null
  created_at: string
  updated_at: string
}

export type GitHubCommit = {
  sha: string
  html_url: string | null
  commit: {
    message: string
    author: {
      name: string | null
      email: string | null
      date: string
    } | null
  }
  author: {
    id: number
    login: string
    avatar_url: string | null
    html_url: string | null
  } | null
}

export function getGitHubInstallationSettingsUrl(
  accountLogin: string,
  accountType: string
) {
  const normalizedType = accountType.toLowerCase()

  if (normalizedType === 'organization') {
    return `https://github.com/organizations/${accountLogin}/settings/installations`
  }

  return 'https://github.com/settings/installations'
}

export async function fetchInstallation(installationId: string) {
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: createGitHubHeaders(createGitHubAppJwt()),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch installation: ${response.status}`)
  }

  return (await response.json()) as GitHubInstallation
}

export async function fetchInstallationRepositories(installationId: string) {
  const token = await createInstallationAccessToken(installationId)
  const response = await fetch(
    'https://api.github.com/installation/repositories',
    {
      headers: createGitHubHeaders(token),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories: ${response.status}`)
  }

  const data = (await response.json()) as InstallationRepositoriesResponse

  return data.repositories
}

export async function fetchRepositoryPullRequests(
  installationId: string,
  owner: string,
  repo: string,
  updatedSince?: string | null
) {
  const token = await createInstallationAccessToken(installationId)
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls`)
  url.searchParams.set('state', 'all')
  url.searchParams.set('sort', 'updated')
  url.searchParams.set('direction', 'desc')
  url.searchParams.set('per_page', '100')

  if (!updatedSince) {
    return fetchPaginated<GitHubPullRequest>(url.toString(), token)
  }

  return fetchPaginatedUntil<GitHubPullRequest>(
    url.toString(),
    token,
    (pullRequest) => new Date(pullRequest.updated_at) <= new Date(updatedSince)
  )
}

export async function fetchPullRequestReviews(
  installationId: string,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const token = await createInstallationAccessToken(installationId)

  return fetchPaginated<GitHubPullRequestReview>(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews?per_page=100`,
    token
  )
}

export async function fetchRepositoryWorkflowRuns(
  installationId: string,
  owner: string,
  repo: string,
  updatedSince?: string | null
) {
  const token = await createInstallationAccessToken(installationId)
  const url = new URL(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs`
  )
  url.searchParams.set('status', 'completed')
  url.searchParams.set('per_page', '100')

  if (!updatedSince) {
    return fetchPaginatedWrapped<GitHubWorkflowRun>(
      url.toString(),
      token,
      'workflow_runs'
    )
  }

  return fetchPaginatedWrappedUntil<GitHubWorkflowRun>(
    url.toString(),
    token,
    'workflow_runs',
    (workflowRun) => new Date(workflowRun.updated_at) <= new Date(updatedSince)
  )
}

export async function fetchRepositoryCommits(
  installationId: string,
  owner: string,
  repo: string,
  defaultBranch: string,
  updatedSince?: string | null
) {
  const token = await createInstallationAccessToken(installationId)
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`)

  url.searchParams.set('sha', defaultBranch)
  url.searchParams.set('per_page', '100')

  if (updatedSince) {
    url.searchParams.set('since', new Date(updatedSince).toISOString())
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits`,
    {
      headers: {
        ...createGitHubHeaders(token),
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    }
  )

  const commits = await response.json()

  return commits
}

async function createInstallationAccessToken(installationId: string) {
  const jwt = createGitHubAppJwt()
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: createGitHubHeaders(jwt),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to create installation token: ${response.status}`)
  }

  const data = (await response.json()) as { token: string }

  return data.token
}

async function fetchPaginated<T>(url: string, token: string) {
  const items: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: createGitHubHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`)
    }

    items.push(...((await response.json()) as T[]))
    nextUrl = getNextPageUrl(response.headers.get('link'))
  }

  return items
}

async function fetchPaginatedUntil<T>(
  url: string,
  token: string,
  shouldStop: (item: T) => boolean
) {
  const items: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: createGitHubHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`)
    }

    const pageItems = (await response.json()) as T[]

    for (const item of pageItems) {
      if (shouldStop(item)) {
        return items
      }

      items.push(item)
    }

    nextUrl = getNextPageUrl(response.headers.get('link'))
  }

  return items
}

async function fetchPaginatedWrapped<T>(
  url: string,
  token: string,
  collectionKey: string
) {
  const items: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: createGitHubHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`)
    }

    const page = (await response.json()) as Record<string, T[]>
    items.push(...(page[collectionKey] ?? []))
    nextUrl = getNextPageUrl(response.headers.get('link'))
  }

  return items
}

async function fetchPaginatedWrappedUntil<T>(
  url: string,
  token: string,
  collectionKey: string,
  shouldStop: (item: T) => boolean
) {
  const items: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: createGitHubHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`)
    }

    const page = (await response.json()) as Record<string, T[]>
    const pageItems = page[collectionKey] ?? []

    for (const item of pageItems) {
      if (shouldStop(item)) {
        return items
      }

      items.push(item)
    }

    nextUrl = getNextPageUrl(response.headers.get('link'))
  }

  return items
}

function createGitHubHeaders(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function getNextPageUrl(linkHeader: string | null) {
  if (!linkHeader) {
    return null
  }

  const nextLink = linkHeader
    .split(',')
    .map((link) => link.trim())
    .find((link) => link.endsWith('rel="next"'))

  return nextLink?.match(/<([^>]+)>/)?.[1] ?? null
}

function createGitHubAppJwt() {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = getPrivateKey()

  if (!appId) {
    throw new Error('GITHUB_APP_ID is not configured')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
    })
  )
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: now - 60,
      exp: now + 10 * 60,
      iss: appId,
    })
  )
  const unsignedToken = `${header}.${payload}`
  const signature = createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(privateKey, 'base64url')

  return `${unsignedToken}.${signature}`
}

function getPrivateKey() {
  if (process.env.GITHUB_PRIVATE_KEY_BASE64) {
    return Buffer.from(
      process.env.GITHUB_PRIVATE_KEY_BASE64,
      'base64'
    ).toString('utf8')
  }

  if (process.env.GITHUB_PRIVATE_KEY) {
    return process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n')
  }

  throw new Error('GitHub private key is not configured')
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url')
}
