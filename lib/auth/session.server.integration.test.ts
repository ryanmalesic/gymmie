import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { beforeEach, expect, test, vi } from "vitest";

import { CALLBACK_PATH_HEADER } from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/session.server";
import { createTestSession } from "@/test/auth";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

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

test("requireSession returns a database session for a valid cookie", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "dashboard@example.com",
    name: "Dashboard User",
  });

  vi.mocked(headers).mockResolvedValue(
    new Headers({ cookie: testSession.cookie }),
  );

  await expect(requireSession()).resolves.toMatchObject({
    user: {
      email: "dashboard@example.com",
      id: testSession.userId,
      name: "Dashboard User",
    },
  });
});

test("requireSession redirects unauthenticated requests with default callback", async () => {
  vi.mocked(headers).mockResolvedValue(new Headers());

  await expect(requireSession()).rejects.toThrow(
    "redirected to /sign-in?callbackUrl=%2Fdashboard",
  );
  expect(redirect).toHaveBeenCalledWith("/sign-in?callbackUrl=%2Fdashboard");
});

test("requireSession uses callback-path header when present", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ [CALLBACK_PATH_HEADER]: "/users" }),
  );

  await expect(requireSession()).rejects.toThrow(
    "redirected to /sign-in?callbackUrl=%2Fusers",
  );
  expect(redirect).toHaveBeenCalledWith("/sign-in?callbackUrl=%2Fusers");
});

test("requireSession falls back to / when callback path header is invalid", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ [CALLBACK_PATH_HEADER]: "https://evil.example.com" }),
  );

  await expect(requireSession()).rejects.toThrow(
    "redirected to /sign-in?callbackUrl=%2F",
  );
  expect(redirect).toHaveBeenCalledWith("/sign-in?callbackUrl=%2F");
});

test("requireSession prioritizes explicit callback over header callback", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ [CALLBACK_PATH_HEADER]: "/users" }),
  );

  await expect(requireSession("/settings")).rejects.toThrow(
    "redirected to /sign-in?callbackUrl=%2Fsettings",
  );
  expect(redirect).toHaveBeenCalledWith("/sign-in?callbackUrl=%2Fsettings");
});
