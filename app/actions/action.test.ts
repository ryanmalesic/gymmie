import { beforeEach, expect, test, vi } from "vitest";

import { createAction } from "@/app/actions/action";
import { auth } from "@/lib/auth";
import { defineCommand } from "@/lib/commands/base";
import { type AuthSession } from "@/lib/commands/types";
import { z } from "@/lib/zod";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn().mockReturnValue({}),
}));

const testRequestSchema = z
  .object({
    email: z.email(),
    name: z.string().min(2),
  })
  .strict()
  .openapi("TestActionRequest");

const testResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .strict()
  .openapi("TestActionResponse");

const testSpec = defineCommand({
  authorize: (_user, input) => input.name !== "forbidden",
  name: "testAction",
  spec: {
    description: "Test action description",
    request: { schema: testRequestSchema },
    response: {
      description: "Success",
      schema: testResponseSchema,
      status: 200,
    },
    summary: "Test action",
  },
  version: "2026-08-27",
});

const mockHandler = vi.fn().mockResolvedValue({ id: "usr_123", name: "Alice" });

const testModule = {
  default: mockHandler,
  spec: testSpec,
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("returns UNAUTHENTICATED error when no session is present", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue(null);

  const action = createAction(testModule);
  const result = await action({ email: "test@example.com", name: "Alice" });

  expect(result).toEqual({
    code: "UNAUTHENTICATED",
    error: "Active session required.",
    success: false,
  });
  expect(mockHandler).not.toHaveBeenCalled();
});

test("returns FORBIDDEN error when authorize predicate fails", async () => {
  const forbiddenSession: AuthSession = {
    session: { expiresAt: new Date(), id: "sess_1" },
    user: { email: "user@example.com", id: "usr_999", name: "User" },
  };
  vi.mocked(auth.api.getSession).mockResolvedValue(
    forbiddenSession as unknown as Awaited<
      ReturnType<typeof auth.api.getSession>
    >,
  );

  const action = createAction(testModule);
  const result = await action({
    email: "test@example.com",
    name: "forbidden",
  });

  expect(result).toEqual({
    code: "FORBIDDEN",
    error: "User 'usr_999' failed authorization policy for 'testAction'.",
    success: false,
  });
  expect(mockHandler).not.toHaveBeenCalled();
});

test("returns SCHEMA_VALIDATION_FAILED on invalid input without checking session", async () => {
  const action = createAction(testModule);
  const result = await action({
    email: "invalid-email",
    name: "A",
  } as unknown as { email: string; name: string });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.code).toBe("SCHEMA_VALIDATION_FAILED");
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.email).toBeDefined();
    expect(result.fieldErrors?.name).toBeDefined();
  }
  expect(auth.api.getSession).not.toHaveBeenCalled();
});

test("executes handler and returns validated result on success", async () => {
  const validSession: AuthSession = {
    session: { expiresAt: new Date(), id: "sess_1" },
    user: { email: "user@example.com", id: "usr_123", name: "Alice" },
  };
  vi.mocked(auth.api.getSession).mockResolvedValue(
    validSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
  );

  const action = createAction(testModule);
  const result = await action({ email: "test@example.com", name: "Alice" });

  expect(result).toEqual({
    data: { id: "usr_123", name: "Alice" },
    success: true,
  });
  expect(mockHandler).toHaveBeenCalledTimes(1);
});
