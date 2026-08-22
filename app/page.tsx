import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { addUser, fetchUsers } from "@/app/users/actions";
import { UsersPage } from "@/components/users/page";
import { makeQueryClient } from "@/lib/query/client";
import { userKeys } from "@/lib/users/keys";

export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = makeQueryClient();
  const users = await fetchUsers();

  if (users.ok) {
    queryClient.setQueryData(userKeys.list(), users.data);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersPage listAction={fetchUsers} mutationAction={addUser} />
    </HydrationBoundary>
  );
}
