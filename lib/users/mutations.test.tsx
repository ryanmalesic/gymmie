import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { userKeys } from "@/lib/users/keys";
import { useCreateUserMutation } from "@/lib/users/mutations";
import { type User } from "@/lib/users/schema";

const mocks = vi.hoisted(() => ({ addUser: vi.fn() }));

vi.mock("@/lib/users/actions", () => ({ addUser: mocks.addUser }));

function createWrapper(withExistingUser = true) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  if (withExistingUser) {
    queryClient.setQueryData(userKeys.list(), [
      { email: "existing@example.com", id: "usr_1", name: "Existing" },
    ]);
  }
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
  mocks.addUser.mockImplementation(() => new Promise(() => {}));
  const { queryClient, wrapper } = createWrapper();
  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  result.current.mutate({ email: "ada@example.com", name: "Ada" });

  await waitFor(() => {
    const data = queryClient.getQueryData<User[]>(userKeys.list());
    expect(data?.find((user) => user.name === "Ada")).toBeDefined();
  });
});

test("on error, cache is rolled back to previous state", async () => {
  mocks.addUser.mockResolvedValue({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
  const { queryClient, wrapper } = createWrapper();
  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  result.current.mutate({ email: "ada@example.com", name: "Ada" });
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(queryClient.getQueryData<User[]>(userKeys.list())).toEqual([
    { email: "existing@example.com", id: "usr_1", name: "Existing" },
  ]);
});

test("on error, an absent cache is restored to its absent state", async () => {
  mocks.addUser.mockResolvedValue({ error: { form: ["Failed"] }, ok: false });
  const { queryClient, wrapper } = createWrapper(false);
  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  result.current.mutate({ email: "ada@example.com", name: "Ada" });
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(queryClient.getQueryData(userKeys.list())).toBeUndefined();
});

test("on success, waits for user-list invalidation", async () => {
  mocks.addUser.mockResolvedValue({
    data: { email: "ada@example.com", id: "usr_2", name: "Ada" },
    ok: true,
  });
  const { queryClient, wrapper } = createWrapper();
  const invalidateSpy = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  await result.current.mutateAsync({
    email: "ada@example.com",
    name: "Ada",
  });

  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.list() });
});
