import { renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { expect, test, vi } from "vitest";

import { useSignOut } from "@/components/dashboard/use-sign-out";
import { authClient } from "@/lib/auth/client";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

test("triggers signOut and routes home on success", async () => {
  const push = vi.fn();
  const refresh = vi.fn();
  vi.mocked(useRouter).mockReturnValue({ push, refresh } as never);

  vi.mocked(authClient.signOut).mockImplementation(async (opts?: unknown) => {
    const options = opts as
      undefined | { fetchOptions?: { onSuccess?: () => void } };
    options?.fetchOptions?.onSuccess?.();
    return {} as never;
  });

  const { result } = renderHook(() => useSignOut());
  await result.current();

  expect(authClient.signOut).toHaveBeenCalledOnce();
  expect(push).toHaveBeenCalledWith("/");
  expect(refresh).toHaveBeenCalledOnce();
});
