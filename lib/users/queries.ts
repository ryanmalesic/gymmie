import { useQuery } from "@tanstack/react-query";

import { type ActionFailure, type ActionResult, fromError } from "@/lib/action";
import { fetchUsers } from "@/lib/users/actions";
import { userKeys } from "@/lib/users/keys";
import { loadUsersFailure, type User } from "@/lib/users/schema";

export function useUsersQuery(initialState?: ActionResult<User[]>) {
  return useQuery<User[], ActionFailure>({
    initialData: initialState?.ok ? initialState.data : undefined,
    queryFn: async () => {
      try {
        const result = await fetchUsers();
        if (!result.ok) {
          throw result;
        }
        return result.data;
      } catch (error) {
        throw fromError(error, {}, loadUsersFailure);
      }
    },
    queryKey: userKeys.list(),
  });
}
