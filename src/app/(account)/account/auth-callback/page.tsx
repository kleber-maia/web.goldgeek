import { redirect } from 'next/navigation';

export default async function AuthCallbackPage({ searchParams }: { searchParams: Promise<{ token?: string; next?: string }> }) {
  const params = await searchParams;
  if (!params.token) redirect('/account/login?error=missing_token');
  const query = new URLSearchParams({ token: params.token });
  if (params.next) query.set('next', params.next);
  redirect(`/api/auth/verify?${query}`);
}
