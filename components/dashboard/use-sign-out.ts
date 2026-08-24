"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

export function useSignOut() {
  const router = useRouter();

  return async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };
}
