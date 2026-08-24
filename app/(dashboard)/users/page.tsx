import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { UsersPage } from "@/components/users";
import { makeQueryClient } from "@/lib/query/client";
import { fetchUsers } from "@/lib/users/actions";
import { userKeys } from "@/lib/users/keys";

export const dynamic = "force-dynamic";

export default async function UsersRoute() {
  const queryClient = makeQueryClient();
  const users = await fetchUsers();

  if (users.ok) {
    queryClient.setQueryData(userKeys.list(), users.data);
  } else {
    console.error("Initial users load failed", users.error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersPage initialState={users} />
    </HydrationBoundary>
  );
}
