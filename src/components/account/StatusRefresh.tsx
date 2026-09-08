'use client';
import { useEffect, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
export default function StatusRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const enabled = /^\/account(?:\/(?:kits|payments|returns|notifications)|\/kit\/[^/]+)?$/.test(pathname);
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => { if (document.visibilityState === 'visible') router.refresh(); };
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [router, enabled]);
  if (!enabled) return null;
  return <div className="flex justify-end mb-3"><button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="text-sm underline">{pending ? 'Refreshing…' : 'Refresh status'}</button></div>;
}
