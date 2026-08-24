import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type ActionFailure, fromError } from "@/lib/action";
import { addUser } from "@/lib/users/actions";
import { userKeys } from "@/lib/users/keys";
import {
  type CreateUser,
  createUserFailure,
  type User,
} from "@/lib/users/schema";

type MutationContext = {
  hadPreviousData: boolean;
  previous?: User[];
};

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    ActionFailure<CreateUser>,
    CreateUser,
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
        throw fromError<CreateUser>(error, {}, createUserFailure);
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
      const previous = queryClient.getQueryData<User[]>(userKeys.list());
      queryClient.setQueryData<User[]>(userKeys.list(), (users) => [
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
