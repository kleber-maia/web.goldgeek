/** Accept only paths within the requested account area, including their query string. */
export function safeLoginDestination(value: string | null | undefined, type: 'customer' | 'admin' = 'customer'): string {
  const root = type === 'admin' ? '/admin' : '/account';
  if (!value || !value.startsWith('/') || /[\\\u0000-\u0020]/.test(value)) return root;
  try {
    const base = 'https://local.invalid';
    const parsed = new URL(value, base);
    if (parsed.origin !== base || !(parsed.pathname === root || parsed.pathname.startsWith(`${root}/`))) return root;
    if (/\/(login|auth-callback|check-email)\/?$/.test(parsed.pathname)) return root;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch { return root; }
}
