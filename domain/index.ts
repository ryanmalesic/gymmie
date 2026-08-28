import "server-only";

import { type LocationCommandName, locationCommands } from "@/domain/locations";
import { type UserCommandName, userCommands } from "@/domain/users";
import { type CommandHandler, type CommandSpec } from "@/lib/commands/types";

export type AllCommandName = LocationCommandName | UserCommandName;

export interface LoadedCommandModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: CommandHandler<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: CommandSpec<any, any, any>;
}

const commandModules = {
  ...locationCommands,
  ...userCommands,
};

let loadedCommandsCache: null | Record<string, LoadedCommandModule> = null;

export async function getAllCommands(): Promise<
  Record<string, LoadedCommandModule>
> {
  if (loadedCommandsCache && process.env.NODE_ENV === "production") {
    return loadedCommandsCache;
  }

  const commands: Record<string, LoadedCommandModule> = {};
  for (const mod of Object.values(commandModules)) {
    commands[mod.spec.name] = {
      default: mod.default,
      spec: mod.spec,
    };
  }

  loadedCommandsCache = commands;
  return commands;
}

export async function getCommand(
  name: string,
  version: string,
): Promise<LoadedCommandModule | undefined> {
  const commands = await getAllCommands();
  const compositeKey = `${name}:${version}`;
  const found = commands[compositeKey];
  if (found) {
    return found;
  }
  const byName = commands[name];
  if (byName && byName.spec.version === version) {
    return byName;
  }
  return undefined;
}
