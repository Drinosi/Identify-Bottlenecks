import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

const faqs = [
  {
    question: 'What is an engineering bottleneck?',
    answer:
      'An engineering bottleneck is a recurring point in software delivery where work slows down, such as an aging pull request review queue or an unstable CI workflow.',
  },
  {
    question: 'What GitHub signals does Bottlenecks track?',
    answer:
      'Bottlenecks surfaces pull request review delays, GitHub Actions pipeline health, workflow failures, and repository-level delivery patterns in one dashboard.',
  },
  {
    question: 'How does Bottlenecks help engineering teams?',
    answer:
      'It turns GitHub activity into focused signals so teams can identify the repository, pull request, or workflow behind a delivery slowdown and decide where to act next.',
  },
  {
    question: 'Do teams need to change their development workflow?',
    answer:
      'No. Teams connect their GitHub organization, select the repositories they want to monitor, and continue working in their existing GitHub workflow.',
  },
]

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteConfig.url}/#software`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        featureList: [
          'Pull request review analytics',
          'GitHub Actions pipeline monitoring',
          'Repository-level delivery signals',
          'Engineering bottleneck detection',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteConfig.url}/#faq`,
        mainEntity: faqs.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  }

  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_45%,#f8fafc_100%)] text-slate-900'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <a
        href='#main-content'
        className='sr-only z-50 rounded-full bg-slate-950 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4'
      >
        Skip to main content
      </a>
      <section className='mx-auto flex w-full max-w-screen-3xl flex-col px-6 pb-16 pt-6 sm:px-10 lg:px-12'>
        <header className='flex flex-wrap items-center justify-between gap-4 rounded-md lg:rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur'>
          <Link
            href='/'
            aria-label='Bottlenecks home'
            className='flex items-center gap-3'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white'>
              IB
            </div>
            <div>
              <p className='m-0 text-sm font-semibold  text-slate-500 uppercase'>
                Bottlenecks
              </p>
              <p className='m-0 text-sm text-slate-600'>
                Engineering signals that point to the real slowdown
              </p>
            </div>
          </Link>
          <nav
            aria-label='Primary navigation'
            className='hidden items-center gap-5 lg:flex'
          >
            <a
              href='#features'
              className='text-sm font-medium text-slate-600 transition hover:text-slate-950'
            >
              Features
            </a>
            <a
              href='#how-it-works'
              className='text-sm font-medium text-slate-600 transition hover:text-slate-950'
            >
              How it works
            </a>
            <a
              href='#faq'
              className='text-sm font-medium text-slate-600 transition hover:text-slate-950'
            >
              FAQ
            </a>
          </nav>
          <div className='flex flex-wrap items-center gap-3'>
            <Link
              href='/sign-in'
              className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
            >
              Sign in
            </Link>
            <Link
              href='/sign-up'
              className='inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700'
            >
              Start free
            </Link>
          </div>
        </header>

        <section
          id='main-content'
          className='grid scroll-mt-6 gap-10 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-center lg:py-24'
        >
          <div className='space-y-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800'>
              <span className='h-2 w-2 rounded-full bg-emerald-500' />
              GitHub engineering analytics for faster software delivery
            </div>

            <div className='space-y-5'>
              <h1 className='m-0 max-w-4xl text-5xl font-semibold  text-slate-950 sm:text-6xl lg:text-7xl'>
                Find and fix engineering bottlenecks in GitHub delivery.
              </h1>
              <p className='m-0 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl'>
                Spot slow pull request reviews, unstable CI pipelines, and
                repository-level delivery risks. Bottlenecks turns GitHub
                activity into actionable engineering signals your team can use.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href='/sign-up'
                className='inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-medium text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-700'
              >
                Create workspace
              </Link>
              <Link
                href='/sign-in'
                className='inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50'
              >
                See your dashboard
              </Link>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='rounded-lg border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
                <p className='m-0 text-sm font-medium text-slate-500'>
                  Open reviews
                </p>
                <p className='mt-3 mb-1 text-3xl font-semibold text-slate-950'>
                  11
                </p>
                <p className='m-0 text-sm text-rose-600'>
                  3 have been waiting for more than 5 days
                </p>
              </div>
              <div className='rounded-lg border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
                <p className='m-0 text-sm font-medium text-slate-500'>
                  Pipeline health
                </p>
                <p className='mt-3 mb-1 text-3xl font-semibold text-slate-950'>
                  82%
                </p>
                <p className='m-0 text-sm text-amber-700'>
                  Failure rate up 14% from the weekly baseline
                </p>
              </div>
              <div className='rounded-lg border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
                <p className='m-0 text-sm font-medium text-slate-500'>
                  Repositories tracked
                </p>
                <p className='mt-3 mb-1 text-3xl font-semibold text-slate-950'>
                  24
                </p>
                <p className='m-0 text-sm text-emerald-700'>
                  7 repos healthy across reviews and CI
                </p>
              </div>
            </div>
          </div>

          <div className='relative'>
            <div className='absolute inset-x-12 top-8 h-32 rounded-full bg-sky-200/50 blur-3xl' />
            <div className='absolute inset-x-16 bottom-10 h-32 rounded-full bg-emerald-200/50 blur-3xl' />
            <div className='relative overflow-hidden rounded-xl border border-slate-200/70 bg-slate-950 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.22)]'>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white/80'>
                <div>
                  <p className='m-0 text-xs font-semibold uppercase text-slate-400'>
                    Live overview
                  </p>
                  <p className='m-0 mt-1 text-sm text-white'>
                    Engineering bottlenecks across GitHub
                  </p>
                </div>
                <span className='rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-200'>
                  2 active risks
                </span>
              </div>

              <div className='mt-4 grid gap-4'>
                <div className='rounded-lg bg-white p-5'>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <p className='m-0 text-sm font-medium text-slate-500'>
                        Waiting review
                      </p>
                      <p className='mt-3 mb-1 text-4xl font-semibold text-slate-950'>
                        4
                      </p>
                      <p className='m-0 text-sm text-slate-600'>
                        Oldest open PR has been waiting 6.8 days
                      </p>
                    </div>
                    <span className='rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700'>
                      Bottleneck
                    </span>
                  </div>
                  <div className='mt-5 grid gap-3'>
                    <div className='rounded-md border border-slate-200 bg-slate-50 px-4 py-3'>
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <p className='m-0 text-sm font-medium text-slate-900'>
                            api-platform
                          </p>
                          <p className='m-0 mt-1 text-xs text-slate-500'>
                            2 PRs waiting, oldest 6.8d
                          </p>
                        </div>
                        <span className='rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800'>
                          Watch
                        </span>
                      </div>
                    </div>
                    <div className='rounded-md border border-slate-200 bg-slate-50 px-4 py-3'>
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <p className='m-0 text-sm font-medium text-slate-900'>
                            mobile-backend
                          </p>
                          <p className='m-0 mt-1 text-xs text-slate-500'>
                            1 PR waiting, oldest 4.1d
                          </p>
                        </div>
                        <span className='rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800'>
                          Stable
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='rounded-lg border border-white/10 bg-white/6 p-5 text-white'>
                    <p className='m-0 text-sm font-medium text-slate-300'>
                      Pipeline trend
                    </p>
                    <p className='mt-3 mb-2 text-3xl font-semibold'>9 failed</p>
                    <p className='m-0 text-sm text-slate-300'>
                      Main workflow failures jumped compared with the last 7
                      days
                    </p>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/6 p-5 text-white'>
                    <p className='m-0 text-sm font-medium text-slate-300'>
                      Connected repos
                    </p>
                    <p className='mt-3 mb-2 text-3xl font-semibold'>24</p>
                    <p className='m-0 text-sm text-slate-300'>
                      Private and public repositories, grouped in one view
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id='features'
          aria-labelledby='features-heading'
          className='grid scroll-mt-6 gap-6 lg:grid-cols-3'
        >
          <h2 id='features-heading' className='sr-only'>
            Engineering delivery analytics for GitHub teams
          </h2>
          <div className='rounded-xl border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
            <p className='m-0 text-sm font-semibold  text-slate-400 uppercase'>
              Why teams use it
            </p>
            <h2 className='mt-4 mb-3 text-2xl font-semibold  text-slate-950'>
              GitHub shows events. You need the pattern.
            </h2>
            <p className='m-0 text-base leading-7 text-slate-600'>
              Individual pull requests and workflow runs are easy to inspect.
              What is harder is seeing when a delay becomes a team habit.
            </p>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
            <p className='m-0 text-sm font-semibold  text-slate-400 uppercase'>
              What gets surfaced
            </p>
            <h2 className='mt-4 mb-3 text-2xl font-semibold  text-slate-950'>
              Review queues, CI pain, and risky repository drift.
            </h2>
            <p className='m-0 text-base leading-7 text-slate-600'>
              Instead of forcing teams into giant process dashboards, we focus
              on the few signals that usually cause the most frustration.
            </p>
          </div>
          <div className='rounded-xl border border-slate-200 bg-slate-900 p-7 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]'>
            <p className='m-0 text-sm font-semibold  text-slate-400 uppercase'>
              Setup
            </p>
            <h2 className='mt-4 mb-3 text-2xl font-semibold '>
              Connect your GitHub app and start from the repos you already own.
            </h2>
            <p className='m-0 text-base leading-7 text-slate-300'>
              No spreadsheet cleanup, no manual status reviews, and no need to
              teach the team a new workflow just to get useful visibility.
            </p>
          </div>
        </section>

        <section
          id='how-it-works'
          className='grid scroll-mt-6 gap-8 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start'
        >
          <div className='space-y-4'>
            <p className='m-0 text-sm font-semibold  text-slate-400 uppercase'>
              How it works
            </p>
            <h2 className='m-0 text-4xl font-semibold  text-slate-950'>
              A simple flow that gets you to the blocker faster.
            </h2>
            <p className='m-0 max-w-xl text-lg leading-8 text-slate-600'>
              Keep the setup light, connect the repos that matter, and get to
              the exact review queue or CI issue that is slowing delivery down.
            </p>
          </div>

          <div className='grid gap-4'>
            <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white'>
                  1
                </div>
                <div>
                  <h3 className='m-0 text-xl font-semibold text-slate-950'>
                    Connect your GitHub organization
                  </h3>
                  <p className='m-0 mt-2 text-base leading-7 text-slate-600'>
                    Install the GitHub App, pick the repositories you care
                    about, and let the dashboard sync the key signals.
                  </p>
                </div>
              </div>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-sm font-semibold text-white'>
                  2
                </div>
                <div>
                  <h3 className='m-0 text-xl font-semibold text-slate-950'>
                    Watch for slowdowns and sudden regressions
                  </h3>
                  <p className='m-0 mt-2 text-base leading-7 text-slate-600'>
                    See aged pull requests, pipeline instability, and shifts in
                    delivery patterns before they become normal.
                  </p>
                </div>
              </div>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-sm font-semibold text-white'>
                  3
                </div>
                <div>
                  <h3 className='m-0 text-xl font-semibold text-slate-950'>
                    Go from signal to repo-level detail
                  </h3>
                  <p className='m-0 mt-2 text-base leading-7 text-slate-600'>
                    Drill into the exact repository, pull request, or workflow
                    behind the alert so the next action is obvious.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id='faq'
          aria-labelledby='faq-heading'
          className='scroll-mt-6 border-y border-slate-200 py-16'
        >
          <div className='max-w-3xl'>
            <p className='m-0 text-sm font-semibold text-slate-400 uppercase'>
              Frequently asked questions
            </p>
            <h2
              id='faq-heading'
              className='mt-4 mb-3 text-sm 2xl:text-4xl font-semibold  text-slate-950'
            >
              Engineering bottleneck detection, explained.
            </h2>
            <p className='m-0 text-lg leading-8 text-slate-600'>
              Learn how Bottlenecks turns everyday GitHub activity into a
              clearer view of software delivery health.
            </p>
          </div>
          <div className='mt-8 grid gap-4 lg:grid-cols-2'>
            {faqs.map(({ question, answer }) => (
              <article
                key={question}
                className='rounded-xl border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.05)]'
              >
                <h3 className='m-0 text-xl font-semibold text-slate-950'>
                  {question}
                </h3>
                <p className='m-0 mt-3 text-base leading-7 text-slate-600'>
                  {answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className='mt-16 rounded-xl border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-10'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-2xl'>
              <p className='m-0 text-sm font-semibold  text-slate-400 uppercase'>
                Start here
              </p>
              <h2 className='mt-4 mb-3 text-2xl lg:text-4xl font-semibold  text-slate-950'>
                Find the delivery bottleneck before it costs another sprint.
              </h2>
              <p className='m-0 text-base lg:text-lg text-slate-600'>
                Create an account, connect GitHub, and make the first bottleneck
                visible.
              </p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Link
                href='/sign-up'
                className='inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-slate-700'
              >
                Create account
              </Link>
              <Link
                href='/sign-in'
                className='inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50'
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <footer className='flex flex-col gap-3 pt-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between'>
          <p className='m-0'>
            Bottlenecks — engineering delivery analytics for GitHub teams.
          </p>
          <div className='flex gap-4'>
            <a href='#features' className='transition hover:text-slate-950'>
              Features
            </a>
            <a href='#how-it-works' className='transition hover:text-slate-950'>
              How it works
            </a>
            <a href='#faq' className='transition hover:text-slate-950'>
              FAQ
            </a>
          </div>
        </footer>
      </section>
    </main>
  )
}
