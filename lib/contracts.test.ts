import { expect, test } from "vitest";

import { rpcSchemas } from "@/lib/contracts";
import { z } from "@/lib/zod";

test("derives strict request and response schemas from model", () => {
  const model = z.object({
    createdAt: z.date(),
    email: z.string().email(),
    id: z.string(),
    name: z.string(),
  });

  const { requestSchema, responseSchema } = rpcSchemas({
    model,
    name: "User",
    pickRequest: ["email", "name"] as const,
    pickResponse: ["id", "email", "name"] as const,
  });

  const validReq = requestSchema.parse({ email: "a@b.com", name: "Alice" });
  expect(validReq).toEqual({ email: "a@b.com", name: "Alice" });

  const validRes = responseSchema.parse({
    email: "a@b.com",
    id: "1",
    name: "Alice",
  });
  expect(validRes).toEqual({ email: "a@b.com", id: "1", name: "Alice" });

  expect(() => requestSchema.parse({ extra: "bad", ...validReq })).toThrow();
});
