import {
  type CommandHandler,
  type CommandSpec,
  ErrorResponseSchema,
} from "@/lib/commands/types";
import { registry } from "@/lib/openapi";
import { type z } from "@/lib/zod";

export type InferCommand<
  TSpec extends CommandSpec<z.ZodTypeAny, z.ZodTypeAny>,
> =
  TSpec extends CommandSpec<infer TReq, infer TRes>
    ? CommandHandler<z.infer<TReq>, z.infer<TRes>>
    : never;

export function defineCommand<
  TReq extends z.ZodTypeAny,
  TRes extends z.ZodTypeAny,
>(config: CommandSpec<TReq, TRes>): CommandSpec<TReq, TRes> {
  const versionedPath = `/api/rpc/${config.version}/${config.name}`;

  registry.registerPath({
    deprecated: config.spec.deprecated ?? false,
    description: `[Version Lock: ${config.version}] ${config.spec.description}`,
    method: "post",
    path: versionedPath,
    request: {
      body: {
        content: {
          "application/json": { schema: config.spec.request.schema },
        },
        description: config.spec.request.description,
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
      422: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Unprocessable Entity - Schema validation failed",
      },
      500: {
        content: { "application/json": { schema: ErrorResponseSchema } },
        description: "Internal Server Error",
      },
      [config.spec.response.status]: {
        content: {
          "application/json": { schema: config.spec.response.schema },
        },
        description: config.spec.response.description,
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
    summary: config.spec.summary,
    tags: config.spec.tags ?? [config.version],
  });

  return config;
}
