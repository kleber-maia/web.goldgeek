'use client';
export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-lg px-5 py-16 text-center">
    <h1 className="text-2xl font-semibold">We couldn’t load this page</h1>
    <p className="my-4">Your saved information is safe. Please try again.</p>
    <button onClick={reset} className="account-btn account-btn-primary">Try again</button>
    <p className="mt-6"><a href="/account" className="underline">Back to dashboard</a></p>
  </main>;
}
