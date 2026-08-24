export const CALLBACK_PATH_HEADER = "x-callback-path";
export const DEFAULT_CALLBACK_PATH = "";
const MAX_CALLBACK_URL_LENGTH = 2048;

export function callbackPath(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined> = {},
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const search = query.toString();
  return search === "" ? pathname : `${pathname}?${search}`;
}

export function getSafeCallbackPath(
  candidate: null | string | undefined,
  fallback: string,
): string {
  const normalizedCandidate = normalizePath(candidate);
  if (normalizedCandidate && isSafeCallbackPath(normalizedCandidate)) {
    return normalizedCandidate;
  }

  const normalizedFallback = normalizePath(fallback);
  if (normalizedFallback && isSafeCallbackPath(normalizedFallback)) {
    return normalizedFallback;
  }

  return DEFAULT_CALLBACK_PATH;
}

export function requestPath(url: string): string | undefined {
  try {
    const parsed = new URL(url, appUrl());
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return undefined;
  }
}

function appUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function isSafeCallbackPath(value: null | string | undefined): value is string {
  if (
    !value ||
    value.length > MAX_CALLBACK_URL_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("#") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(value) ||
    /%(?![0-9a-fA-F]{2})/.test(value)
  ) {
    return false;
  }

  try {
    const base = appUrl();
    return new URL(value, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

function normalizePath(value: null | string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (value.includes(":") || value.startsWith("//")) {
    return value;
  }

  return `/${value}`;
}
