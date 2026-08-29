import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createUserAction } from "@/app/actions/users";
import { type CreateUser, type User } from "@/domain/users/schema";
import { userKeys } from "@/hooks/users/keys";
import { type ActionResult } from "@/lib/commands/types";

export type MutationError = {
  code?: string;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ActionResult<User>,
    Error,
    CreateUser,
    { previousUsers?: User[] }
  >({
    mutationFn: async (input: CreateUser) => {
      const result = await createUserAction(input);
      if (!result.success) {
        throw result;
      }
      return result;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.list(), context.previousUsers);
      }
    },
    onMutate: async (newUser: CreateUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.list() });

      const previousUsers = queryClient.getQueryData<User[]>(userKeys.list());

      if (previousUsers) {
        const now = new Date();
        const optimisticUser: User = {
          addressLine1: null,
          addressLine2: null,
          city: null,
          country: "US",
          createdAt: now,
          email: newUser.email,
          emailVerified: false,
          id: `temp-${Date.now()}`,
          image: null,
          latitude: null,
          longitude: null,
          name: newUser.name,
          phone: null,
          postalCode: null,
          state: null,
          stripeAccountId: null,
          stripeAccountStatus: null,
          timezone: "America/New_York",
          updatedAt: now,
        };
        queryClient.setQueryData<User[]>(userKeys.list(), [
          ...previousUsers,
          optimisticUser,
        ]);
      }

      return { previousUsers };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}
