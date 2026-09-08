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

function configuredOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid application URL');
    return url.origin;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Application URL is not configured');
  return 'http://localhost:3000';
}

// Email links must never trust user-controlled Host, Origin or forwarding headers.
export function buildBaseUrlFromHeaders(_headers: HeaderSource): string {
  return configuredOrigin();
}

export function buildBaseUrlFromRequest(_request: Request): string {
  return configuredOrigin();
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
  authVerify: (token: string, next?: string) => {
    const searchParams = new URLSearchParams({
      token,
    });

    if (next) {
      searchParams.set('next', next);
    }

    return `/api/auth/verify?${searchParams.toString()}`;
  },
} as const;
