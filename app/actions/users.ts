"use server";

import { createAction } from "@/app/actions/action";
import * as createStripeAccountLink from "@/domain/users/commands/create-stripe-account-link.command";
import * as createUser from "@/domain/users/commands/create.command";
import * as deleteUser from "@/domain/users/commands/delete.command";
import * as getMyUser from "@/domain/users/commands/get-my.command";
import * as getMyStripeAccountState from "@/domain/users/commands/get-stripe-account-state.command";
import * as listUsers from "@/domain/users/commands/list.command";
import * as onboardMe from "@/domain/users/commands/onboard-me.command";
import * as readUser from "@/domain/users/commands/read.command";
import * as updateUser from "@/domain/users/commands/update.command";

export const createUserAction = createAction(createUser);
export const readUserAction = createAction(readUser);
export const updateUserAction = createAction(updateUser);
export const deleteUserAction = createAction(deleteUser);
export const listUsersAction = createAction(listUsers);
export const createStripeAccountLinkAction = createAction(
  createStripeAccountLink,
);
export const getMyStripeAccountStateAction = createAction(
  getMyStripeAccountState,
);
export const getMyUserAction = createAction(getMyUser);
export const onboardMeAction = createAction(onboardMe);
