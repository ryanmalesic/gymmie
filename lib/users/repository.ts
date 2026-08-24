import { getPrisma } from "@/lib/db";
import { type CreateUser } from "@/lib/users/schema";

export function createUser(input: CreateUser) {
  return getPrisma().user.create({
    data: {
      email: input.email,
      emailVerified: false,
      name: input.name,
    },
    select: { email: true, id: true, name: true },
  });
}

export function listUsers() {
  return getPrisma().user.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, id: true, name: true },
  });
}
