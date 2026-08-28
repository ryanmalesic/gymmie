import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { expect, test, vi } from "vitest";

import { listUsersAction } from "@/app/actions/users";
import { useUsersQuery } from "@/hooks/users/queries";
import { QueryProvider } from "@/lib/query/providers";

vi.mock("@/app/actions/users", () => ({
  listUsersAction: vi.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryProvider>{children}</QueryProvider>
);

test("fetches user list via server action", async () => {
  vi.mocked(listUsersAction).mockResolvedValue({
    data: {
      page: 1,
      pageSize: 100,
      totalCount: 1,
      users: [
        {
          createdAt: new Date(),
          email: "test@example.com",
          id: "u1",
          name: "Test",
        },
      ],
    },
    success: true,
  });

  const { result } = renderHook(() => useUsersQuery(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
  expect(result.current.data?.[0].email).toBe("test@example.com");
});
