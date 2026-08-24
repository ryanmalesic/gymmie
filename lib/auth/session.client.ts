"use client";

export const DEFAULT_CALLBACK_PATH = "";
const CALLBACK_URL_BASE = "https://gymmie.internal";
const MAX_CALLBACK_URL_LENGTH = 2048;

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
    return new URL(value, CALLBACK_URL_BASE).origin === CALLBACK_URL_BASE;
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
