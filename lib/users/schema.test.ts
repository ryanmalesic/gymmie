import { expect, test } from "vitest";
import { flattenError } from "zod";

import { userInputSchema } from "@/lib/users/schema";

test("trims the name and lowercases the email", () => {
  expect(
    userInputSchema.safeParse({
      email: "  Ada@Example.com ",
      name: "  Ada Lovelace  ",
    }),
  ).toMatchObject({
    data: {
      email: "ada@example.com",
      name: "Ada Lovelace",
    },
    success: true,
  });
});

test("rejects a blank name", () => {
  const result = userInputSchema.safeParse({
    email: "ada@example.com",
    name: "   ",
  });

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors).toEqual({
    name: ["Name is required"],
  });
});

test("rejects a blank email without also calling it invalid", () => {
  const result = userInputSchema.safeParse({
    email: "   ",
    name: "Ada",
  });

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors).toEqual({
    email: ["Email is required"],
  });
});

test("rejects an invalid email", () => {
  const result = userInputSchema.safeParse({
    email: "ada",
    name: "Ada",
  });

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors).toEqual({
    email: ["Email is invalid"],
  });
});
