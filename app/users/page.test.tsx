import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import UsersRoute from "@/app/users/page";
import { requireSession } from "@/lib/auth/session.server";
import { makeQueryClient } from "@/lib/query/client";
import { fetchUsers } from "@/lib/users/actions";

vi.mock("@/components/users/page", () => ({
  UsersPage: ({ initialState }: { initialState: { ok: boolean } }) => (
    <p>Users page ({initialState.ok ? "success" : "failure"})</p>
  ),
}));
vi.mock("@/lib/auth/session.server", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/users/actions", () => ({ fetchUsers: vi.fn() }));

const fetchUsersMock = vi.mocked(fetchUsers);
const requireSessionMock = vi.mocked(requireSession);

beforeEach(() => {
  fetchUsersMock.mockReset();
  requireSessionMock.mockReset();
  requireSessionMock.mockResolvedValue({} as never);
});

test("renders an initial user-list failure and logs it", async () => {
  fetchUsersMock.mockResolvedValue({
    error: { form: ["Unable to load users"] },
    ok: false,
  });

  const errorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  render(
    <QueryClientProvider client={makeQueryClient()}>
      {await UsersRoute()}
    </QueryClientProvider>,
  );

  expect(screen.getByText("Users page (failure)")).toBeInTheDocument();
  expect(fetchUsersMock).toHaveBeenCalledOnce();
  expect(errorSpy).toHaveBeenCalledWith("Initial users load failed", {
    form: ["Unable to load users"],
  });
  errorSpy.mockRestore();
});

test("loads users before rendering the client page", async () => {
  fetchUsersMock.mockResolvedValue({
    data: [
      {
        email: "member@example.com",
        id: "user-1",
        name: "Member",
      },
    ],
    ok: true,
  });

  render(
    <QueryClientProvider client={makeQueryClient()}>
      {await UsersRoute()}
    </QueryClientProvider>,
  );

  expect(requireSessionMock).toHaveBeenCalledOnce();
  expect(fetchUsersMock).toHaveBeenCalledOnce();
  expect(screen.getByText("Users page (success)")).toBeInTheDocument();
});
