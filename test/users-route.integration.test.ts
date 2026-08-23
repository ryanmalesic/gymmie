import { expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import UsersRoute from "@/app/(authenticated)/users/page";
import { addUser } from "@/app/users/actions";

test("hydrates the authenticated users route with the existing user listing", async () => {
  const ada = await addUser({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });
  const al = await addUser({ email: "al@example.com", name: "Al" });

  expect(ada.ok).toBe(true);
  expect(al.ok).toBe(true);
  if (!ada.ok || !al.ok) {
    return;
  }

  const route = await UsersRoute();
  const state = (
    route as unknown as {
      props: {
        state: {
          queries: Array<{ state: { data: unknown } }>;
        };
      };
    }
  ).props.state;

  expect(state.queries[0]?.state.data).toEqual([
    {
      email: "al@example.com",
      id: al.data.id,
      name: "Al",
    },
    {
      email: "ada@example.com",
      id: ada.data.id,
      name: "Ada Lovelace",
    },
  ]);
});
