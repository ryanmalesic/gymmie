import { expect, expectTypeOf, test } from "vitest";

import { defineCommand } from "@/lib/commands/base";
import { z } from "@/lib/zod";

test("defineCommand registers command spec and returns it", () => {
  const spec = defineCommand({
    authorize: () => true,
    name: "testCommand",
    spec: {
      description: "Test command description",
      request: {
        description: "Test request",
        schema: z.object({ value: z.string() }),
      },
      response: {
        description: "Test response",
        schema: z.object({ result: z.string() }),
        status: 200,
      },
      summary: "Test command",
    },
    version: "2026-08-27",
  });

  expect(spec.name).toBe("testCommand");
  expect(spec.version).toBe("2026-08-27");
});

test("defineCommand infers the referred record from load", () => {
  const spec = defineCommand({
    load: {
      entity: "Widget",
      fetch: async (_user, input: { id: string }) => ({
        id: input.id,
        ownerId: "usr_1",
      }),
    },
    authorize: (user, _input, record) => record.ownerId === user.id,
    name: "testRecordCommand",
    spec: {
      description: "Test record load",
      request: {
        schema: z.object({ id: z.string() }),
      },
      response: {
        description: "ok",
        schema: z.object({ ok: z.boolean() }),
        status: 200,
      },
      summary: "Test record command",
    },
    version: "2026-08-28",
  });

  expectTypeOf(spec.authorize).parameter(2).toEqualTypeOf<{
    id: string;
    ownerId: string;
  }>();
});
