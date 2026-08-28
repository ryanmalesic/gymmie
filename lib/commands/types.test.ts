import { expect, test } from "vitest";

import { ErrorCodeSchema, ErrorResponseSchema } from "@/lib/commands/types";

test("validates error response schema structure", () => {
  const validError = {
    code: "NOT_FOUND",
    error: "Resource not found",
    success: false as const,
  };

  const parsed = ErrorResponseSchema.parse(validError);
  expect(parsed.code).toBe("NOT_FOUND");
  expect(parsed.success).toBe(false);

  expect(ErrorCodeSchema.parse("UNAUTHENTICATED")).toBe("UNAUTHENTICATED");
});
