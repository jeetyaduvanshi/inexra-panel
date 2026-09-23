import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cleans user-pasted URLs to fix common paste errors:
 * 1. Accidental duplicated schemes (e.g. "httpshttps://", "httphttps://") -> "https://"
 * 2. Missing colons or slashes (e.g. "https//" -> "https://")
 * 3. Nested URLs: if text contains an internal "https://" or "http://" after index 0
 *    (e.g., "https://foo.chttps://foo.com/..." or "foohttps://bar.com/..."),
 *    it extracts the valid intended URL starting with "http://" or "https://".
 */
export function cleanUrlInput(raw: string | undefined | null): string {
    if (!raw) return '';
    let url = raw.trim();

    // Fix httpshttps:// or httphttp:// or similar typos
    url = url.replace(/^https?https?:\/\//i, 'https://');
    url = url.replace(/^https?:\/\/(https?:\/\/)/i, '$1');

    // If string contains multiple http(s)://, find the last one
    const httpIndices: number[] = [];
    const regex = /https?:\/\//gi;
    let match;
    while ((match = regex.exec(url)) !== null) {
        httpIndices.push(match.index);
    }

    if (httpIndices.length > 1) {
        // Take from the last occurrence of http(s)://
        const lastIndex = httpIndices[httpIndices.length - 1];
        url = url.slice(lastIndex).trim();
    } else if (httpIndices.length === 1 && httpIndices[0] > 0) {
        url = url.slice(httpIndices[0]).trim();
    }

    // Fix "https//" or "http//"
    url = url.replace(/^(https?)\/\/+/i, '$1://');

    return url;
}

/**
 * Validates whether a string is a well-formed HTTP/HTTPS URL with a valid domain.
 */
export function isValidHttpUrl(urlStr: string | undefined | null): boolean {
    if (!urlStr) return false;
    const cleaned = urlStr.trim();
    if (!/^https?:\/\//i.test(cleaned)) return false;

    try {
        const parsed = new URL(cleaned);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
        if (!parsed.hostname) return false;
        if (parsed.hostname.includes('://') || parsed.hostname.includes('https') || parsed.hostname.includes('http')) {
            return false;
        }
        if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

