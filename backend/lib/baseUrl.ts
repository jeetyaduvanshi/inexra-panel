/**
 * Base URL Resolution and Sanitization Helper
 *
 * Ensures that all survey links, callback links, and redirects point to the
 * Inexra Panel application (e.g. inexra-panel.vercel.app or custom panel subdomain),
 * and NEVER to the marketing website (inexraresearch.com / www.inexraresearch.com).
 */

export const PANEL_DEFAULT_FALLBACK = 'https://panel.inexraresearch.com';

/**
 * Checks if a given host, hostname, or URL belongs to the marketing website.
 * Matches apex inexraresearch.com and www.inexraresearch.com, but ALLOWS panel.inexraresearch.com.
 */
export function isMarketingDomain(hostOrUrl?: string | null): boolean {
    if (!hostOrUrl) return false;
    try {
        const raw = hostOrUrl.includes('://') ? new URL(hostOrUrl).host : hostOrUrl;
        const clean = raw.split(':')[0].toLowerCase().trim();
        return clean === 'inexraresearch.com' || clean === 'www.inexraresearch.com';
    } catch {
        const lower = hostOrUrl.toLowerCase().trim().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
        return lower === 'inexraresearch.com' || lower === 'www.inexraresearch.com';
    }
}

/**
 * Resolves the active base URL for the Inexra Panel from incoming request headers
 * or environment variables. Guaranteed to never return the marketing website domain.
 */
export function getBaseUrl(req?: Request): string {
    if (req) {
        const forwardedHost = req.headers.get('x-forwarded-host');
        if (forwardedHost) {
            const host = forwardedHost.split(',')[0].trim();
            if (!isMarketingDomain(host)) {
                const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
                return `${proto}://${host}`;
            }
        }

        const host = req.headers.get('host');
        if (host && !isMarketingDomain(host)) {
            const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
            return `${proto}://${host}`;
        }

        const originHeader = req.headers.get('origin');
        if (originHeader && !isMarketingDomain(originHeader)) {
            return originHeader.replace(/\/$/, '');
        }
    }

    if (process.env.NEXT_PUBLIC_BASE_URL && !isMarketingDomain(process.env.NEXT_PUBLIC_BASE_URL)) {
        return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
    }

    if (process.env.VERCEL_URL) {
        const vercelHost = process.env.VERCEL_URL.replace(/\/$/, '');
        if (!isMarketingDomain(vercelHost)) {
            return `https://${vercelHost}`;
        }
    }

    return PANEL_DEFAULT_FALLBACK;
}

/**
 * Normalizes a URL: if it points to the marketing website (inexraresearch.com),
 * replaces the origin with the panel's active baseUrl while preserving the path and query parameters.
 */
export function sanitizePanelUrl(url: string | undefined | null, baseUrl: string, fallbackPathAndQuery = ''): string {
    if (!url || !url.trim()) {
        return fallbackPathAndQuery ? `${baseUrl}${fallbackPathAndQuery.startsWith('/') ? '' : '/'}${fallbackPathAndQuery}` : '';
    }

    try {
        const parsed = new URL(url.trim());
        if (isMarketingDomain(parsed.host)) {
            return `${baseUrl}${parsed.pathname}${parsed.search}`;
        }
        return url.trim();
    } catch {
        return fallbackPathAndQuery ? `${baseUrl}${fallbackPathAndQuery.startsWith('/') ? '' : '/'}${fallbackPathAndQuery}` : url;
    }
}

/**
 * Builds a standardized survey callback URL pointing to the panel.
 */
export function buildCallbackUrl(baseUrl: string, projectId: string, status: string): string {
    return `${baseUrl}/api/survey-callback?uid=[uid]&sessionId=[sessionId]&pid=${encodeURIComponent(projectId)}&status=${status}&redirect=true`;
}
