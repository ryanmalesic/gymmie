import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type ActionFailure, type ActionResult } from "@/lib/action";
import { userKeys } from "@/lib/users/keys";
import { type ListedUser } from "@/lib/users/queries";
import { type UserInput } from "@/lib/users/schema";

export type CreateUserMutationError = ActionFailure<UserInput>;

type MutationAction = (
  input: UserInput,
) => Promise<ActionResult<ListedUser, UserInput>>;

export function useCreateUserMutation(action: MutationAction) {
  const queryClient = useQueryClient();

  return useMutation<
    ListedUser,
    unknown,
    UserInput,
    { previous?: ListedUser[] }
  >({
    mutationFn: async (input: UserInput) => {
      const result = await action(input);
      if (!result.ok) throw result;
      return result.data;
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<ListedUser[]>(
          userKeys.list(),
          context.previous,
        );
      }
    },
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.list() });
      const previous = queryClient.getQueryData<ListedUser[]>(userKeys.list());
      queryClient.setQueryData<ListedUser[]>(userKeys.list(), (old) => [
        {
          email: newUser.email,
          id: `optimistic_${Date.now()}`,
          name: newUser.name,
        },
        ...(old ?? []),
      ]);
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}
