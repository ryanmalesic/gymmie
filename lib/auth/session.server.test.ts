import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { beforeEach, expect, test, vi } from "vitest";

import { CALLBACK_PATH_HEADER } from "@/lib/auth/session";
import { getSession, requireSession } from "@/lib/auth/session.server";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

class RedirectedError extends Error {
  constructor(readonly destination: string) {
    super(`redirected to ${destination}`);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(redirect).mockImplementation((destination) => {
    throw new RedirectedError(destination);
  });
});

test("getSession resolves the current session with request headers", async () => {
  const requestHeaders = new Headers({ cookie: "session=test" });
  vi.mocked(headers).mockResolvedValue(requestHeaders);
  mocks.getSession.mockResolvedValue(null);

  await expect(getSession()).resolves.toBeNull();
  expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
});

test("getSession propagates session resolver failures", async () => {
  const error = new Error("session service unavailable");
  vi.mocked(headers).mockResolvedValue(new Headers());
  mocks.getSession.mockRejectedValue(error);

  await expect(getSession()).rejects.toBe(error);
});

test("requireSession returns the session when authentication is required and present", async () => {
  const session = {} as Awaited<ReturnType<typeof requireSession>>;
  vi.mocked(headers).mockResolvedValue(new Headers());
  mocks.getSession.mockResolvedValue(session);

  await expect(requireSession()).resolves.toBe(session);
  expect(redirect).not.toHaveBeenCalled();
});

test("requireSession redirects to the invoking page with the requested callback", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({
      referer: "https://gymmie.example/users?tab=members&filter=name%3Aalice",
    }),
  );
  mocks.getSession.mockResolvedValue(null);

  await expect(requireSession()).rejects.toMatchObject({
    destination:
      "/sign-in?callbackUrl=%2Fusers%3Ftab%3Dmembers%26filter%3Dname%253Aalice",
  });
});

test("requireSession uses the proxy-stamped request path", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({
      [CALLBACK_PATH_HEADER]: "/users?tab=members&filter=name%3Aalice",
    }),
  );
  mocks.getSession.mockResolvedValue(null);

  await expect(requireSession()).rejects.toMatchObject({
    destination:
      "/sign-in?callbackUrl=%2Fusers%3Ftab%3Dmembers%26filter%3Dname%253Aalice",
  });
});
test("requireSession prefers an explicit callback path over request metadata", async () => {
  vi.mocked(headers).mockResolvedValue(new Headers({ "next-url": "/users" }));
  mocks.getSession.mockResolvedValue(null);

  await expect(
    requireSession("/users?tab=members&filter=name%3Aalice"),
  ).rejects.toMatchObject({
    destination:
      "/sign-in?callbackUrl=%2Fusers%3Ftab%3Dmembers%26filter%3Dname%253Aalice",
  });
});

test("requireSession uses request URL metadata for server actions", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ "next-url": "/users?tab=members" }),
  );
  mocks.getSession.mockResolvedValue(null);

  await expect(requireSession()).rejects.toMatchObject({
    destination: "/sign-in?callbackUrl=%2Fusers%3Ftab%3Dmembers",
  });
});

test("requireSession rejects unsafe request URL metadata", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ referer: "https://evil.example//evil" }),
  );
  mocks.getSession.mockResolvedValue(null);

  await expect(requireSession()).rejects.toMatchObject({
    destination: "/sign-in?callbackUrl=",
  });
});
