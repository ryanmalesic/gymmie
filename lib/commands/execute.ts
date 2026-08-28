import "server-only";

import { auth } from "@/lib/auth";
import {
  ForbiddenError,
  SchemaValidationError,
  UnauthenticatedError,
} from "@/lib/commands/errors";
import {
  type AuthSession,
  type CommandContext,
  type CommandHandler,
  type CommandSpec,
} from "@/lib/commands/types";
import { getPrisma } from "@/lib/db";
import { type z } from "@/lib/zod";

export interface CommandModule<
  TReq extends z.ZodTypeAny = z.ZodTypeAny,
  TRes extends z.ZodTypeAny = z.ZodTypeAny,
> {
  default: CommandHandler<z.infer<TReq>, z.infer<TRes>>;
  spec: CommandSpec<TReq, TRes>;
}

export async function executeCommand<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
>(
  commandModule: CommandModule<TReq, TRes>,
  rawInput: unknown,
  headers: Headers,
): Promise<z.infer<TRes>> {
  const { default: handler, spec } = commandModule;

  if (!spec || typeof handler !== "function") {
    throw new Error(
      `[CommandModuleError] Module must export 'spec' and a default handler function.`,
    );
  }

  // 1. Inbound Schema & Strict Wire Validation
  const parsedRequest = spec.spec.request.schema.safeParse(rawInput);
  if (!parsedRequest.success) {
    const fieldErrors = parsedRequest.error.flatten().fieldErrors;
    throw new SchemaValidationError(
      parsedRequest.error.message,
      "REQUEST",
      fieldErrors as Record<string, string[]>,
    );
  }

  // 2. BetterAuth Session Verification
  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    throw new UnauthenticatedError();
  }

  // 3. Expressive AuthZ Predicate (Deny by default)
  const isAllowed = await Promise.resolve(
    spec.authorize(session.user, parsedRequest.data),
  ).catch(() => false);

  if (!isAllowed) {
    throw new ForbiddenError(session.user.id, spec.name);
  }

  // 4. Injected Context & In-Process Execution
  const context: CommandContext = {
    commandName: spec.name,
    prisma: getPrisma(),
    session: session as unknown as AuthSession,
    version: spec.version,
  };

  const result = await handler(parsedRequest.data, context);

  // 5. Outbound Response Schema Validation
  const parsedResponse = spec.spec.response.schema.safeParse(result);
  if (!parsedResponse.success) {
    throw new SchemaValidationError(parsedResponse.error.message, "RESPONSE");
  }

  return parsedResponse.data;
}
