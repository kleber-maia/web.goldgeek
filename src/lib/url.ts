type HeaderSource = Pick<Headers, 'get'>;

export function normalizeBaseUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

export function resolveBaseUrl(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) return normalized;
  }

  return '';
}

export function buildBaseUrlFromHeaders(headers: HeaderSource): string {
  const host = headers.get('x-forwarded-host') || headers.get('host');
  if (!host) return '';

  const proto =
    headers.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https');

  return normalizeBaseUrl(`${proto}://${host}`);
}

export function buildBaseUrlFromRequest(request: Request): string {
  const forwardedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  const forwardedBase = forwardedHost
    ? `${forwardedProto || (forwardedHost.includes('localhost') ? 'http' : 'https')}://${forwardedHost}`
    : null;

  return resolveBaseUrl(
    forwardedBase,
    request.headers.get('origin'),
    new URL(request.url).origin
  );
}

export function buildAbsoluteUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedBaseUrl
    ? `${normalizedBaseUrl}${normalizedPath}`
    : normalizedPath;
}

export const appRoutes = {
  accountKits: () => '/account/kits',
  accountKit: (kitId: string) => `/account/kit/${kitId}`,
  adminPayments: () => '/admin/payments',
  adminReturns: () => '/admin/returns',
  authVerify: (token: string) =>
    `/api/auth/verify?token=${encodeURIComponent(token)}`,
} as const;
