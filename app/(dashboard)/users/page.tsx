import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { listUsersAction } from "@/app/actions/users";
import { UsersPage } from "@/components/users";
import { userKeys } from "@/hooks/users";
import { makeQueryClient } from "@/lib/query/client";

export const dynamic = "force-dynamic";

export default async function UsersRoute() {
  const queryClient = makeQueryClient();
  const users = await listUsersAction({ page: 1, pageSize: 100 });

  if (users.success) {
    queryClient.setQueryData(userKeys.list(), users.data.users);
  } else {
    console.error("Initial users load failed", users.error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersPage initialState={users} />
    </HydrationBoundary>
  );
}
