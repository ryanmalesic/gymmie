import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { type ActionResult } from "@/lib/action";
import { userKeys } from "@/lib/users/keys";
import { useCreateUserMutation } from "@/lib/users/mutations";
import { type ListedUser } from "@/lib/users/queries";
import { type UserInput } from "@/lib/users/schema";

type MutationAction = (
  input: UserInput,
) => Promise<ActionResult<ListedUser, UserInput>>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  queryClient.setQueryData(userKeys.list(), [
    { email: "existing@example.com", id: "usr_1", name: "Existing" },
  ]);
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

test("optimistic insert adds entry to cache before server responds", async () => {
  const action: MutationAction = () => new Promise(() => {});

  const { queryClient, wrapper } = createWrapper();
  const { result } = renderHook(() => useCreateUserMutation(action), {
    wrapper,
  });

  result.current.mutate({ email: "ada@example.com", name: "Ada" });

  await waitFor(() => {
    const data = queryClient.getQueryData<ListedUser[]>(userKeys.list());
    expect(data?.find((u) => u.name === "Ada")).toBeDefined();
  });
});

test("on error, cache is rolled back to previous state", async () => {
  const action: MutationAction = async () => ({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });

  const { queryClient, wrapper } = createWrapper();
  const { result } = renderHook(() => useCreateUserMutation(action), {
    wrapper,
  });

  result.current.mutate({ email: "ada@example.com", name: "Ada" });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const data = queryClient.getQueryData<ListedUser[]>(userKeys.list());
  expect(data).toHaveLength(1);
  expect(data?.[0]?.name).toBe("Existing");
});

test("on success, invalidateQueries is called", async () => {
  const action: MutationAction = async () => ({
    data: { email: "ada@example.com", id: "usr_2", name: "Ada" },
    ok: true,
  });

  const { queryClient, wrapper } = createWrapper();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateUserMutation(action), {
    wrapper,
  });

  result.current.mutate({ email: "ada@example.com", name: "Ada" });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(invalidateSpy).toHaveBeenCalledWith(
    expect.objectContaining({ queryKey: userKeys.list() }),
  );
});
