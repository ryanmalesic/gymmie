import { type PrismaClient } from "@/lib/generated/prisma/client";
import { z } from "@/lib/zod";

export const ErrorCodeSchema = z
  .enum([
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "SCHEMA_VALIDATION_FAILED",
    "CONFLICT",
    "BAD_REQUEST",
    "INTERNAL_ERROR",
  ])
  .openapi("ErrorCode");

export type ActionResult<TData> =
  | {
      code: ErrorCode;
      error: string;
      fieldErrors?: Record<string, string[]>;
      success: false;
    }
  | { data: TData; success: true };

export type AuthorizePredicate<TInput, TRecord = undefined> = (
  user: SessionUser,
  input: TInput,
  record: TRecord,
  prisma: PrismaClient,
) => boolean | Promise<boolean>;

export interface AuthSession {
  session: {
    expiresAt: Date;
    id: string;
  };
  user: SessionUser;
}

export type CommandContext<TRecord = undefined> = ([TRecord] extends [undefined]
  ? { readonly record?: undefined }
  : { readonly record: TRecord }) & {
  readonly commandName: string;
  readonly prisma: PrismaClient;
  readonly session: AuthSession;
  readonly version: string;
};

export type CommandHandler<TInput, TOutput, TRecord = undefined> = (
  input: TInput,
  context: CommandContext<TRecord>,
) => Promise<TOutput>;

export interface CommandOpenApiSpec<
  TReq extends z.ZodTypeAny = z.ZodTypeAny,
  TRes extends z.ZodTypeAny = z.ZodTypeAny,
> {
  deprecated?: boolean;
  description: string;
  request: {
    description?: string;
    schema: TReq;
  };
  response: {
    description: string;
    schema: TRes;
    status: number;
  };
  summary: string;
  tags?: string[];
}

export interface CommandSpec<
  TReq extends z.ZodTypeAny = z.ZodTypeAny,
  TRes extends z.ZodTypeAny = z.ZodTypeAny,
  TRecord = undefined,
> {
  readonly authorize: AuthorizePredicate<z.infer<TReq>, TRecord>;
  readonly load?: Load<z.infer<TReq>, TRecord>;
  readonly name: string;
  readonly spec: CommandOpenApiSpec<TReq, TRes>;
  readonly version: string;
}

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export interface Load<TInput, TRecord> {
  entity: string;
  fetch: (
    user: SessionUser,
    input: TInput,
    prisma: PrismaClient,
  ) => PromiseLike<null | TRecord>;
}

export interface SessionUser {
  email: string;
  id: string;
  name?: null | string;
}

export const ErrorResponseSchema = z
  .object({
    code: ErrorCodeSchema,
    error: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    success: z.literal(false),
  })
  .strict()
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
