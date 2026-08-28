import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import UsersRoute from "@/app/(dashboard)/users/page";
import { listUsersAction } from "@/app/actions/users";

vi.mock("@/app/actions/users", () => ({ listUsersAction: vi.fn() }));

const listUsersMock = vi.mocked(listUsersAction);

beforeEach(() => {
  listUsersMock.mockReset();
});

test("renders an initial user-list failure and logs it", async () => {
  listUsersMock.mockResolvedValue({
    code: "INTERNAL_ERROR",
    error: "Unable to load users",
    success: false,
  });

  const errorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      {await UsersRoute()}
    </QueryClientProvider>,
  );

  expect(
    screen.getByRole("status", { name: "Loading people" }),
  ).toBeInTheDocument();
  expect(listUsersMock).toHaveBeenCalled();
  expect(errorSpy).toHaveBeenCalledWith(
    "Initial users load failed",
    "Unable to load users",
  );
  errorSpy.mockRestore();
});

test("loads and renders real users list on success", async () => {
  listUsersMock.mockResolvedValue({
    data: {
      page: 1,
      pageSize: 100,
      totalCount: 1,
      users: [
        {
          createdAt: new Date(),
          email: "member@example.com",
          id: "user-1",
          name: "Member Name",
        },
      ],
    },
    success: true,
  });

  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      {await UsersRoute()}
    </QueryClientProvider>,
  );

  expect(listUsersMock).toHaveBeenCalled();
  expect(screen.getByText("Member Name")).toBeInTheDocument();
  expect(screen.getByText("member@example.com")).toBeInTheDocument();
});
