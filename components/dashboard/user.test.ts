import { expect, test } from "vitest";

import { userInitials } from "@/components/dashboard/user";

test("builds initials from the first letters of a name", () => {
  expect(userInitials("Ada Lovelace")).toBe("AL");
  expect(userInitials("  route test user  ")).toBe("RT");
  expect(userInitials("Gymmie")).toBe("G");
  expect(userInitials("   ")).toBe("?");
});
