import Link from 'next/link'

export default function Home() {
  return (
    <main className='grid min-h-screen place-items-center px-6 py-12'>
      <section className='grid w-full max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='m-0 text-sm font-semibold text-slate-600'>
          Identify Bottlenecks
        </p>
        <h1 className='m-0 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl'>
          Start with auth, then build the company workflow.
        </h1>
        <p className='m-0 max-w-2xl text-base leading-7 text-slate-600'>
          This app is now set up to use Better Auth with email and password as
          the first real foundation.
        </p>
        <div className='flex flex-wrap gap-3'>
          <Link
            href='/sign-up'
            className='inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700'
          >
            Create account
          </Link>
          <Link
            href='/sign-in'
            className='inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50'
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  )
}
