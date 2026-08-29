import "server-only";

import * as createUser from "@/domain/users/commands/create.command";
import * as deleteUser from "@/domain/users/commands/delete.command";
import * as getMyUser from "@/domain/users/commands/get-my.command";
import * as listUsers from "@/domain/users/commands/list.command";
import * as onboardMe from "@/domain/users/commands/onboard-me.command";
import * as readUser from "@/domain/users/commands/read.command";
import * as updateUser from "@/domain/users/commands/update.command";

export * from "@/domain/users/gate";

export const userCommands = {
  createUser,
  deleteUser,
  getMyUser,
  listUsers,
  onboardMe,
  readUser,
  updateUser,
} as const;

export type UserCommandName = keyof typeof userCommands;
