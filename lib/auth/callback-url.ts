const MAX_CALLBACK_URL_LENGTH = 2048;
const INTERNAL_ORIGIN = "https://gymmie.internal";

export type SafeCallbackUrl = string;

/**
 * Combines a pathname with its raw query string without reserializing either
 * part. The query string may include its leading `?`; when it does not, the
 * separator is added by this function.
 */
export function buildCallbackUrl(
  pathname: string,
  queryString: string,
): SafeCallbackUrl {
  if (
    typeof pathname !== "string" ||
    typeof queryString !== "string" ||
    pathname.includes("?") ||
    pathname.includes("#")
  ) {
    return "/";
  }

  const callbackUrl = queryString
    ? `${pathname}${queryString.startsWith("?") ? "" : "?"}${queryString}`
    : pathname;

  return normalizeCallbackUrl(callbackUrl);
}

/**
 * Returns whether a callback value is an internal, origin-relative URL.
 *
 * The value is intentionally validated without decoding or reserializing it,
 * so callers can preserve the original pathname and query-string bytes.
 */
export function isSafeCallbackUrl(value: string): value is SafeCallbackUrl {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  if (
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
    return new URL(value, INTERNAL_ORIGIN).origin === INTERNAL_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * Returns a safe callback value, falling back to the application root when
 * the supplied value is missing or unsafe.
 */
export function normalizeCallbackUrl(
  value: null | string | undefined,
): SafeCallbackUrl {
  return value && isSafeCallbackUrl(value) ? value : "/";
}
