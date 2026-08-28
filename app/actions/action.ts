import "server-only";
import { headers } from "next/headers";

import { toErrorResponse } from "@/lib/commands/errors";
import { type CommandModule, executeCommand } from "@/lib/commands/execute";
import { type ActionResult } from "@/lib/commands/types";
import { type z } from "@/lib/zod";

export function createAction<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
  TRecord = undefined,
>(
  commandModule: CommandModule<TReq, TRes, TRecord>,
): (input: z.infer<TReq>) => Promise<ActionResult<z.infer<TRes>>> {
  return async function (
    rawInput: z.infer<TReq>,
  ): Promise<ActionResult<z.infer<TRes>>> {
    try {
      const data = await executeCommand(
        commandModule,
        rawInput,
        await headers(),
      );
      return { data, success: true };
    } catch (error: unknown) {
      const { code, error: message, fieldErrors } = toErrorResponse(error);
      return {
        code,
        error: message,
        fieldErrors,
        success: false,
      };
    }
  };
}
