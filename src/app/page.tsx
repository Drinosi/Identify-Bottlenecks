import Link from 'next/link'

export default function Home() {
  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_45%,#f8fafc_100%)] text-slate-900'>
      <section className='mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-10 lg:px-12'>
        <header className='flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white'>
              IB
            </div>
            <div>
              <p className='m-0 text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase'>
                Identify Bottlenecks
              </p>
              <p className='m-0 text-sm text-slate-600'>
                Engineering signals that point to the real slowdown
              </p>
            </div>
          </div>
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

        <section className='grid gap-10 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-center lg:py-24'>
          <div className='space-y-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800'>
              <span className='h-2 w-2 rounded-full bg-emerald-500' />
              Connect GitHub and spot the slowdown before the sprint slips
            </div>

            <div className='space-y-5'>
              <h1 className='m-0 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl'>
                Find where your delivery flow actually gets stuck.
              </h1>
              <p className='m-0 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl'>
                Pull requests waiting too long, flaky pipelines, and risky repo
                patterns should surface themselves. Identify Bottlenecks turns
                GitHub activity into clear signals your team can act on fast.
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
              <div className='rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
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
              <div className='rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
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
              <div className='rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
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
            <div className='relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-950 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.22)]'>
              <div className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80'>
                <div>
                  <p className='m-0 text-xs font-semibold tracking-[0.2em] uppercase text-slate-400'>
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
                <div className='rounded-3xl bg-white p-5'>
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
                    <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
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
                    <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
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
                  <div className='rounded-3xl border border-white/10 bg-white/6 p-5 text-white'>
                    <p className='m-0 text-sm font-medium text-slate-300'>
                      Pipeline trend
                    </p>
                    <p className='mt-3 mb-2 text-3xl font-semibold'>9 failed</p>
                    <p className='m-0 text-sm text-slate-300'>
                      Main workflow failures jumped compared with the last 7
                      days
                    </p>
                  </div>
                  <div className='rounded-3xl border border-white/10 bg-white/6 p-5 text-white'>
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

        <section className='grid gap-6 lg:grid-cols-3'>
          <div className='rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
            <p className='m-0 text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase'>
              Why teams use it
            </p>
            <h2 className='mt-4 mb-3 text-2xl font-semibold tracking-tight text-slate-950'>
              GitHub shows events. You need the pattern.
            </h2>
            <p className='m-0 text-base leading-7 text-slate-600'>
              Individual pull requests and workflow runs are easy to inspect.
              What is harder is seeing when a delay becomes a team habit.
            </p>
          </div>
          <div className='rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
            <p className='m-0 text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase'>
              What gets surfaced
            </p>
            <h2 className='mt-4 mb-3 text-2xl font-semibold tracking-tight text-slate-950'>
              Review queues, CI pain, and risky repository drift.
            </h2>
            <p className='m-0 text-base leading-7 text-slate-600'>
              Instead of forcing teams into giant process dashboards, we focus
              on the few signals that usually cause the most frustration.
            </p>
          </div>
          <div className='rounded-[2rem] border border-slate-200 bg-slate-900 p-7 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]'>
            <p className='m-0 text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase'>
              Setup
            </p>
            <h2 className='mt-4 mb-3 text-2xl font-semibold tracking-tight'>
              Connect your GitHub app and start from the repos you already own.
            </h2>
            <p className='m-0 text-base leading-7 text-slate-300'>
              No spreadsheet cleanup, no manual status reviews, and no need to
              teach the team a new workflow just to get useful visibility.
            </p>
          </div>
        </section>

        <section className='grid gap-8 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start'>
          <div className='space-y-4'>
            <p className='m-0 text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase'>
              How it works
            </p>
            <h2 className='m-0 text-4xl font-semibold tracking-tight text-slate-950'>
              A simple flow that gets you to the blocker faster.
            </h2>
            <p className='m-0 max-w-xl text-lg leading-8 text-slate-600'>
              Keep the setup light, connect the repos that matter, and get to
              the exact review queue or CI issue that is slowing delivery down.
            </p>
          </div>

          <div className='grid gap-4'>
            <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white'>
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
            <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-semibold text-white'>
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
            <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]'>
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-sm font-semibold text-white'>
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

        <section className='rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-10'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-2xl'>
              <p className='m-0 text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase'>
                Start here
              </p>
              <h2 className='mt-4 mb-3 text-4xl font-semibold tracking-tight text-slate-950'>
                Give engineering teams a homepage that immediately explains the
                value.
              </h2>
              <p className='m-0 text-lg leading-8 text-slate-600'>
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
      </section>
    </main>
  )
}
