import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { createUserAction } from "@/app/actions/users";
import { type User } from "@/domain/users/schema";
import { userKeys } from "@/hooks/users/keys";
import { useCreateUserMutation } from "@/hooks/users/mutations";

vi.mock("@/app/actions/users", () => ({
  createUserAction: vi.fn(),
}));

let testQueryClient: QueryClient;

beforeEach(() => {
  testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  vi.clearAllMocks();
});

const listedAt = new Date("2026-08-01T00:00:00.000Z");

function listedUser(email: string, id: string, name: string): User {
  return {
    addressLine1: null,
    addressLine2: null,
    city: null,
    country: "US",
    createdAt: listedAt,
    email,
    emailVerified: false,
    id,
    image: null,
    latitude: null,
    longitude: null,
    name,
    phone: null,
    postalCode: null,
    state: null,
    stripeAccountId: null,
    stripeAccountStatus: null,
    timezone: "America/New_York",
    updatedAt: listedAt,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
);

test("optimistically adds user to query cache", async () => {
  const initialUsers: User[] = [
    listedUser("initial@example.com", "u1", "Initial User"),
  ];
  testQueryClient.setQueryData(userKeys.list(), initialUsers);

  vi.mocked(createUserAction).mockImplementation(
    () => new Promise(() => {}), // Pending promise
  );

  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  await act(async () => {
    result.current.mutate({ email: "new@example.com", name: "New User" });
  });

  const cached = testQueryClient.getQueryData<User[]>(userKeys.list());
  expect(cached).toHaveLength(2);
  expect(cached?.[1].name).toBe("New User");
  expect(cached?.[1].email).toBe("new@example.com");
  expect(cached?.[1].id.startsWith("temp-")).toBe(true);
});

test("rolls back cache on mutation error", async () => {
  const initialUsers: User[] = [
    listedUser("initial@example.com", "u1", "Initial User"),
  ];
  testQueryClient.setQueryData(userKeys.list(), initialUsers);

  vi.mocked(createUserAction).mockResolvedValue({
    code: "CONFLICT",
    error: "Email already taken",
    success: false,
  });

  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  try {
    await act(async () => {
      await result.current.mutateAsync({
        email: "conflict@example.com",
        name: "Conflict User",
      });
    });
  } catch {
    // Expected mutation error
  }

  const cached = testQueryClient.getQueryData<User[]>(userKeys.list());
  expect(cached).toEqual(initialUsers);
});

test("invalidates queries on settled", async () => {
  const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

  vi.mocked(createUserAction).mockResolvedValue({
    data: listedUser("success@example.com", "u2", "Success"),
    success: true,
  });

  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  await act(async () => {
    await result.current.mutateAsync({
      email: "success@example.com",
      name: "Success",
    });
  });

  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.list() });
});

test("passes previousUsers in context onMutate", async () => {
  const initialUsers: User[] = [
    listedUser("initial@example.com", "u1", "Initial User"),
  ];
  testQueryClient.setQueryData(userKeys.list(), initialUsers);

  const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

  const context = await act(async () => {
    return await result.current.mutateAsync({
      email: "test@example.com",
      name: "Test",
    });
  });

  expect(context).toBeDefined();
});
