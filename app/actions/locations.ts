"use server";

import { createAction } from "@/app/actions/action";
import * as createLocation from "@/domain/locations/commands/create.command";
import * as deleteLocation from "@/domain/locations/commands/delete.command";
import * as listMyLocations from "@/domain/locations/commands/list-my.command";
import * as readLocation from "@/domain/locations/commands/read.command";
import * as updateLocation from "@/domain/locations/commands/update.command";

export const createLocationAction = createAction(createLocation);
export const readLocationAction = createAction(readLocation);
export const updateLocationAction = createAction(updateLocation);
export const deleteLocationAction = createAction(deleteLocation);
export const listMyLocationsAction = createAction(listMyLocations);
