import { createSign } from 'crypto'

type GitHubRepository = {
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

export async function fetchInstallationRepositories(installationId: string) {
  const token = await createInstallationAccessToken(installationId)
  const response = await fetch('https://api.github.com/installation/repositories', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories: ${response.status}`)
  }

  const data = (await response.json()) as InstallationRepositoriesResponse

  return data.repositories
}

async function createInstallationAccessToken(installationId: string) {
  const jwt = createGitHubAppJwt()
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to create installation token: ${response.status}`)
  }

  const data = (await response.json()) as { token: string }

  return data.token
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
    return Buffer.from(process.env.GITHUB_PRIVATE_KEY_BASE64, 'base64').toString(
      'utf8'
    )
  }

  if (process.env.GITHUB_PRIVATE_KEY) {
    return process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n')
  }

  throw new Error('GitHub private key is not configured')
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url')
}
