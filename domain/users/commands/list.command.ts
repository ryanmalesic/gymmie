import "server-only";

import { userSchema } from "@/domain/users/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { WireInt, z } from "@/lib/zod";

const requestSchema = z
  .object({
    page: WireInt(1, 1000).default(1),
    pageSize: WireInt(1, 100, 20).default(20),
  })
  .strict()
  .openapi("ListUsersRequest");

const responseSchema = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    totalCount: z.number().int().min(0),
    users: z.array(userSchema),
  })
  .strict()
  .openapi("ListUsersResponse");

export const spec = defineCommand({
  authorize: () => true,
  name: "ListUsers",
  spec: {
    description: "Queries users with pagination.",
    request: { description: "Pagination", schema: requestSchema },
    response: {
      description: "Paginated user collection",
      schema: responseSchema,
      status: 200,
    },
    summary: "List paginated users",
    tags: ["Users"],
  },
});

const listUsers: InferCommand<typeof spec> = async (input, { prisma }) => {
  const skip = (input.page - 1) * input.pageSize;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: input.pageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    page: input.page,
    pageSize: input.pageSize,
    totalCount,
    users,
  };
};

export default listUsers;
