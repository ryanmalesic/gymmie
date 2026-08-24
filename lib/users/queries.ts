import { useQuery } from "@tanstack/react-query";

import { type ActionResult } from "@/lib/action";
import { fetchUsers } from "@/lib/users/actions";
import { type UserActionError } from "@/lib/users/errors";
import { userKeys } from "@/lib/users/keys";
import { type ListedUser, type UserInput } from "@/lib/users/schema";

export type UsersQueryInitialState = ActionResult<ListedUser[], UserInput>;

export function useUsersQuery(initialState?: UsersQueryInitialState) {
  return useQuery<ListedUser[], UserActionError>({
    initialData: initialState?.ok ? initialState.data : undefined,
    queryFn: async () => {
      const result = await fetchUsers();
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    queryKey: userKeys.list(),
  });
}
