import { beforeEach, expect, test, vi } from "vitest";

import { auth } from "@/lib/auth";
import { defineCommand } from "@/lib/commands/base";
import {
  ForbiddenError,
  NotFoundError,
  SchemaValidationError,
  UnauthenticatedError,
} from "@/lib/commands/errors";
import { executeCommand } from "@/lib/commands/execute";
import { z } from "@/lib/zod";

const testSpec = defineCommand({
  authorize: (user) => user.id === "user_valid",
  name: "testExecute",
  spec: {
    description: "Testing execute pipeline",
    request: {
      schema: z.object({ value: z.string().min(1) }).strict(),
    },
    response: {
      description: "Echo output",
      schema: z.object({ result: z.string() }).strict(),
      status: 200,
    },
    summary: "Test command",
  },
  version: "2026-08-27",
});

const testHandler = vi
  .fn()
  .mockImplementation(async (input: { value: string }) => ({
    result: `echo:${input.value}`,
  }));

const commandModule = {
  default: testHandler,
  spec: testSpec,
};

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn().mockReturnValue({}),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("executes successful command pipeline", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "test@example.com", id: "user_valid", name: "Valid" },
  } as never);

  const data = await executeCommand(
    commandModule,
    { value: "hello" },
    new Headers(),
  );
  expect(data).toEqual({ result: "echo:hello" });
});

test("throws SchemaValidationError on invalid request", async () => {
  await expect(
    executeCommand(commandModule, { unexpectedField: 123 }, new Headers()),
  ).rejects.toThrow(SchemaValidationError);
});

test("throws UnauthenticatedError when session is missing", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue(null);

  await expect(
    executeCommand(commandModule, { value: "hello" }, new Headers()),
  ).rejects.toThrow(UnauthenticatedError);
});

test("throws ForbiddenError when authorize returns false", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "other@example.com", id: "user_forbidden", name: "Other" },
  } as never);

  await expect(
    executeCommand(commandModule, { value: "hello" }, new Headers()),
  ).rejects.toThrow(ForbiddenError);
});

const recordSpec = defineCommand({
  load: {
    entity: "Widget",
    fetch: async (_user, input: { id: string }) =>
      input.id === "missing" ? null : { id: input.id, ownerId: "user_valid" },
  },
  authorize: (user, _input, record) => record.ownerId === user.id,
  name: "testRecordExecute",
  spec: {
    description: "Testing record load",
    request: {
      schema: z.object({ id: z.string().min(1) }).strict(),
    },
    response: {
      description: "Record id",
      schema: z.object({ result: z.string() }).strict(),
      status: 200,
    },
    summary: "Test record command",
  },
  version: "2026-08-27",
});

const recordHandler = vi
  .fn()
  .mockImplementation(
    async (_input: { id: string }, context: { record: { id: string } }) => ({
      result: context.record.id,
    }),
  );

const recordModule = {
  default: recordHandler,
  spec: recordSpec,
};

test("loads the referred record and passes it to authorize and the handler", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "test@example.com", id: "user_valid", name: "Valid" },
  } as never);

  const data = await executeCommand(recordModule, { id: "w_1" }, new Headers());
  expect(data).toEqual({ result: "w_1" });
  expect(recordHandler).toHaveBeenCalledWith(
    { id: "w_1" },
    expect.objectContaining({
      record: { id: "w_1", ownerId: "user_valid" },
    }),
  );
});

test("throws NotFoundError when the referred record is missing", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "test@example.com", id: "user_valid", name: "Valid" },
  } as never);

  await expect(
    executeCommand(recordModule, { id: "missing" }, new Headers()),
  ).rejects.toThrow(NotFoundError);
});

test("throws ForbiddenError when authorize rejects the loaded record", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "other@example.com", id: "user_forbidden", name: "Other" },
  } as never);

  await expect(
    executeCommand(recordModule, { id: "w_1" }, new Headers()),
  ).rejects.toThrow(ForbiddenError);
});
