import "server-only";

import * as createLocation from "@/domain/locations/commands/create.command";
import * as deleteLocation from "@/domain/locations/commands/delete.command";
import * as listMyLocations from "@/domain/locations/commands/list-my.command";
import * as readLocation from "@/domain/locations/commands/read.command";
import * as updateLocation from "@/domain/locations/commands/update.command";

export const locationCommands = {
  createLocation,
  deleteLocation,
  listMyLocations,
  readLocation,
  updateLocation,
} as const;

export type LocationCommandName = keyof typeof locationCommands;
