import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { UserSchema } from "@/lib/generated/zod";
import { WireDateTime, WireInt, z } from "@/lib/zod";

const requestSchema = z
  .object({
    createdAfter: WireDateTime.optional(),
    page: WireInt(1, 1000).default(1),
    pageSize: WireInt(1, 100).default(20),
  })
  .strict()
  .openapi("ListUsersRequest");

const responseSchema = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    totalCount: z.number().int().min(0),
    users: z.array(
      UserSchema.pick({
        createdAt: true,
        email: true,
        id: true,
        name: true,
      }).strict(),
    ),
  })
  .strict()
  .openapi("ListUsersResponse");

export const spec = defineCommand({
  authorize: () => true,
  name: "listUsers",
  spec: {
    description: "Queries users with pagination and date filters.",
    request: { description: "Pagination and filters", schema: requestSchema },
    response: {
      description: "Paginated user collection",
      schema: responseSchema,
      status: 200,
    },
    summary: "List paginated users",
    tags: ["Users"],
  },
  version: "2026-08-27",
});

const listUsers: InferCommand<typeof spec> = async (input, { prisma }) => {
  const skip = (input.page - 1) * input.pageSize;
  const whereClause = {
    ...(input.createdAfter && { createdAt: { gte: input.createdAfter } }),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, email: true, id: true, name: true },
      skip,
      take: input.pageSize,
      where: whereClause,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    page: input.page,
    pageSize: input.pageSize,
    totalCount,
    users,
  };
};

export default listUsers;
