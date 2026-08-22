const fallbackUrl = 'http://localhost:3000'

function toAbsoluteUrl(value: string | undefined) {
  if (!value) return null

  const withProtocol = value.startsWith('http') ? value : `https://${value}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

export const siteConfig = {
  name: 'Bottlenecks',
  title: 'Engineering Bottleneck Detection for GitHub | Bottlenecks',
  description:
    'Find slow pull request reviews, unstable CI pipelines, and repository-level delivery risks with actionable engineering analytics for GitHub teams.',
  url:
    toAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    toAbsoluteUrl(process.env.NEXT_PUBLIC_BETTER_AUTH_URL) ??
    toAbsoluteUrl(process.env.BETTER_AUTH_URL) ??
    toAbsoluteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    fallbackUrl,
}
