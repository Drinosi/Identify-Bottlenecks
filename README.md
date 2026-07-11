# Identify Bottlenecks

Next.js app with Better Auth and Postgres

## Local Development

Create a local env file:

```bash
cp .env.example .env
```

Start Postgres:

```bash
docker compose up postgres
```

For a fresh database, Postgres runs SQL files from `db/migrations` on the first
volume initialization. If the `postgres_data` volume already exists, apply new
migrations manually or recreate the volume.

In another terminal, run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Email Verification

New accounts must verify their email before they can sign in. Better Auth sends
verification links and, after the email is confirmed, the app finishes org
setup or invite acceptance from the saved sign-up intent.

For real email delivery, configure:

```bash
EMAIL_FROM=hello@example.com
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

If `RESEND_API_KEY` and `EMAIL_FROM` are not set, the app logs verification
links to the server console instead, which is handy for local development.

## GitHub App Setup

The GitHub integration expects these environment variables:

```bash
GITHUB_APP_NAME=your-github-app-name
GITHUB_APP_ID=your-github-app-id
GITHUB_PRIVATE_KEY_BASE64=your-base64-private-key
```

`GITHUB_APP_NAME` should be the GitHub App slug used in the install URL.
`GITHUB_APP_ID` is the stable numeric app ID from GitHub. The private key can
also be supplied with `GITHUB_PRIVATE_KEY` if you prefer the raw PEM value.

Use this callback URL in your GitHub App settings:

```text
http://localhost:3000/api/github/callback
```

Recommended repository permissions for the current sync flow:

- Pull requests: Read-only
- Actions: Read-only
- Contents / Metadata: Read-only

After installing the app for an organization, use the dashboard to sync
repositories and then sync pull requests.

## Organization Invites

Owners and admins can invite members from the dashboard. Invites generate a
join link that is tied to the invited email address and expires after 7 days.

Invited users can:

- sign in with an existing account and accept the invite
- create a new account from the invite flow without creating a separate
  organization first

## Postgress

docker compose exec postgres psql -U postgres -d bottleneck

## Docker

Build and run the full stack:

```bash
docker compose up --build
```

The app is available at [http://localhost:3000](http://localhost:3000), and
Postgres is exposed on `localhost:5432`.

## Checks

```bash
npm run lint
npm run build
```
