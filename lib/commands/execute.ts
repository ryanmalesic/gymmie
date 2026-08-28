import "server-only";

import { auth } from "@/lib/auth";
import {
  ForbiddenError,
  NotFoundError,
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
  TRecord = undefined,
> {
  default: CommandHandler<z.infer<TReq>, z.infer<TRes>, TRecord>;
  spec: CommandSpec<TReq, TRes, TRecord>;
}

export async function executeCommand<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
  TRecord = undefined,
>(
  commandModule: CommandModule<TReq, TRes, TRecord>,
  rawInput: unknown,
  headers: Headers,
): Promise<z.infer<TRes>> {
  const { default: handler, spec } = commandModule;

  if (!spec || typeof handler !== "function") {
    throw new Error(
      `[CommandModuleError] Module must export 'spec' and a default handler function.`,
    );
  }

  const parsedRequest = spec.spec.request.schema.safeParse(rawInput);
  if (!parsedRequest.success) {
    const fieldErrors = parsedRequest.error.flatten().fieldErrors;
    throw new SchemaValidationError(
      parsedRequest.error.message,
      "REQUEST",
      fieldErrors as Record<string, string[]>,
    );
  }

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    throw new UnauthenticatedError();
  }

  const prisma = getPrisma();
  const user = session.user;
  const input = parsedRequest.data;
  let record: TRecord | undefined;

  if (spec.load) {
    const loaded = await spec.load.fetch(user, input, prisma);
    if (loaded == null) {
      throw new NotFoundError(spec.load.entity, recordId(input) || user.id);
    }
    record = loaded;
  }

  const isAllowed = await Promise.resolve(
    spec.authorize(user, input, record as TRecord, prisma),
  ).catch(() => false);

  if (!isAllowed) {
    throw new ForbiddenError(session.user.id, spec.name);
  }

  const context = {
    commandName: spec.name,
    prisma,
    session: session as unknown as AuthSession,
    version: spec.version,
    ...(spec.load ? { record } : {}),
  } as CommandContext<TRecord>;

  const result = await handler(input, context);

  const parsedResponse = spec.spec.response.schema.safeParse(result);
  if (!parsedResponse.success) {
    throw new SchemaValidationError(parsedResponse.error.message, "RESPONSE");
  }

  return parsedResponse.data;
}

function recordId(input: unknown): string {
  if (
    typeof input === "object" &&
    input !== null &&
    "id" in input &&
    typeof input.id === "string"
  ) {
    return input.id;
  }

  return "";
}
