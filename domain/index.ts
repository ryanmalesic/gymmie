import "server-only";
import fs from "node:fs";
import path from "node:path";

import { type UserCommandName } from "@/domain/users";
import { type CommandHandler, type CommandSpec } from "@/lib/commands/types";

export type AllCommandName = UserCommandName;

export interface LoadedCommandModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: CommandHandler<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: CommandSpec<any, any>;
}

let loadedCommandsCache: null | Record<string, LoadedCommandModule> = null;

export async function getAllCommands(): Promise<
  Record<string, LoadedCommandModule>
> {
  if (loadedCommandsCache && process.env.NODE_ENV === "production") {
    return loadedCommandsCache;
  }

  const commands: Record<string, LoadedCommandModule> = {};
  const domainDir = path.resolve(process.cwd(), "domain");
  const files = findCommandFiles(domainDir);

  for (const file of files) {
    const mod = await import(/* turbopackIgnore: true */ file);
    if (
      mod.spec?.name &&
      mod.spec?.version &&
      typeof mod.default === "function"
    ) {
      commands[mod.spec.name] = {
        default: mod.default,
        spec: mod.spec,
      };
    }
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

function findCommandFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findCommandFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".command.ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}
