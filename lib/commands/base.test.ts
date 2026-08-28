import { expect, test } from "vitest";

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
