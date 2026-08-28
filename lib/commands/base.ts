import {
  type AuthorizePredicate,
  type CommandHandler,
  type CommandOpenApiSpec,
  type CommandSpec,
  ErrorResponseSchema,
  Load,
} from "@/lib/commands/types";
import { API_VERSION } from "@/lib/commands/version";
import { registry } from "@/lib/openapi";
import { type z } from "@/lib/zod";

export { API_VERSION };

export type InferCommand<TSpec> =
  TSpec extends CommandSpec<
    infer TReq extends z.ZodTypeAny,
    infer TRes extends z.ZodTypeAny,
    infer TRecord
  >
    ? CommandHandler<z.infer<TReq>, z.infer<TRes>, TRecord>
    : never;

type LoadedRecord<TFetched> = Exclude<Awaited<TFetched>, null>;

export function defineCommand<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
>(spec: {
  load?: never;
  authorize: AuthorizePredicate<z.infer<TReq>, undefined>;
  name: string;
  spec: CommandOpenApiSpec<TReq, TRes>;
  version?: string;
}): CommandSpec<TReq, TRes, undefined>;
export function defineCommand<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
  TFetched,
>(spec: {
  load: Load<z.infer<TReq>, TFetched>;
  authorize: AuthorizePredicate<z.infer<TReq>, LoadedRecord<NoInfer<TFetched>>>;
  name: string;
  spec: CommandOpenApiSpec<TReq, TRes>;
  version?: string;
}): CommandSpec<TReq, TRes, LoadedRecord<TFetched>>;
export function defineCommand<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
  TRecord = undefined,
>(
  spec: Omit<CommandSpec<TReq, TRes, TRecord>, "version"> & {
    version?: string;
  },
): CommandSpec<TReq, TRes, TRecord> {
  const version = spec.version ?? API_VERSION;
  const versionedPath = `/api/rpc/${version}/${spec.name}`;

  registry.registerPath({
    deprecated: spec.spec.deprecated ?? false,
    description: `[Version Lock: ${version}] ${spec.spec.description}`,
    method: "post",
    path: versionedPath,
    request: {
      body: {
        content: {
          "application/json": { schema: spec.spec.request.schema },
        },
        description: spec.spec.request.description,
      },
    },
    responses: {
      400: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Bad Request",
      },
      401: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Unauthenticated - Active session required",
      },
      403: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Forbidden - Insufficient permissions",
      },
      404: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Not Found - Referred record does not exist",
      },
      422: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Unprocessable Entity - Schema validation failed",
      },
      500: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Internal Server Error",
      },
      [spec.spec.response.status]: {
        content: {
          "application/json": { schema: spec.spec.response.schema },
        },
        description: spec.spec.response.description,
        headers: {
          "x-rpc-command": {
            description: "Executed RPC command name",
            schema: { type: "string" },
          },
          "x-rpc-version": {
            description: "Version lock timestamp",
            schema: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    summary: spec.spec.summary,
    tags: spec.spec.tags ?? [version],
  });

  return { ...spec, version };
}
