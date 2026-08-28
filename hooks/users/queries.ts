import { useQuery } from "@tanstack/react-query";

import { listUsersAction } from "@/app/actions/users";
import { type User } from "@/domain/users/schema";
import { userKeys } from "@/hooks/users/keys";
import { type ActionResult } from "@/lib/commands/types";

export function useUsersQuery(initialState?: ActionResult<{ users: User[] }>) {
  return useQuery<User[], Error>({
    initialData: initialState?.success ? initialState.data.users : undefined,
    queryFn: async () => {
      const result = await listUsersAction({ page: 1, pageSize: 100 });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.users;
    },
    queryKey: userKeys.list(),
  });
}
