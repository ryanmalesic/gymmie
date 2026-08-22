import { useQuery } from "@tanstack/react-query";

import { type ActionResult } from "@/lib/action";
import { userKeys } from "@/lib/users/keys";

export type ListedUser = { email: string; id: string; name: string };

type ListFetcher = () => Promise<ActionResult<ListedUser[]>>;

export function useUsersQuery(
  fetcher: ListFetcher,
  initialData?: ListedUser[],
) {
  return useQuery({
    initialData,
    queryFn: async () => {
      const result = await fetcher();
      if (!result.ok) throw new Error(result.error.form?.join(" "));
      return result.data;
    },
    queryKey: userKeys.list(),
  });
}
