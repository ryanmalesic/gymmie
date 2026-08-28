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

export type AuthorizePredicate<TInput> = (
  user: SessionUser,
  input: TInput,
) => boolean | Promise<boolean>;

export interface AuthSession {
  session: {
    expiresAt: Date;
    id: string;
  };
  user: SessionUser;
}

export interface CommandContext {
  readonly commandName: string;
  readonly prisma: PrismaClient;
  readonly session: AuthSession;
  readonly version: string;
}

export type CommandHandler<TInput, TOutput> = (
  input: TInput,
  context: CommandContext,
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
> {
  readonly authorize: AuthorizePredicate<z.infer<TReq>>;
  readonly name: string;
  readonly spec: CommandOpenApiSpec<TReq, TRes>;
  readonly version: string;
}

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

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
