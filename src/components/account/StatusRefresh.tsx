'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
export default function StatusRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = /^\/account(?:\/(?:kits|payments|returns|notifications)|\/kit\/[^/]+)?$/.test(pathname);
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => { if (document.visibilityState === 'visible') router.refresh(); };
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [router, enabled]);
  return null;
}
