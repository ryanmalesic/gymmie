import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isActionFailure } from "@/lib/action";
import { addUser } from "@/lib/users/actions";
import { type UserActionError } from "@/lib/users/errors";
import { userKeys } from "@/lib/users/keys";
import { type ListedUser, type UserInput } from "@/lib/users/schema";

export type CreateUserMutationError = UserActionError;

type MutationContext = {
  hadPreviousData: boolean;
  previous?: ListedUser[];
};

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ListedUser,
    CreateUserMutationError,
    UserInput,
    MutationContext
  >({
    mutationFn: async (input) => {
      try {
        const result = await addUser(input);
        if (!result.ok) {
          throw result;
        }
        return result.data;
      } catch (error) {
        if (error instanceof Error || isActionFailure<UserInput>(error)) {
          throw error;
        }
        throw new Error("Unable to create user", { cause: error });
      }
    },
    onError: (_error, _input, context) => {
      if (!context) {
        return;
      }

      if (context.hadPreviousData) {
        queryClient.setQueryData(userKeys.list(), context.previous);
      } else {
        queryClient.removeQueries({ exact: true, queryKey: userKeys.list() });
      }
    },
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.list() });
      const previous = queryClient.getQueryData<ListedUser[]>(userKeys.list());
      queryClient.setQueryData<ListedUser[]>(userKeys.list(), (users) => [
        {
          email: newUser.email,
          id: `optimistic_${crypto.randomUUID()}`,
          name: newUser.name,
        },
        ...(users ?? []),
      ]);
      return { hadPreviousData: previous !== undefined, previous };
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userKeys.list() }),
  });
}
