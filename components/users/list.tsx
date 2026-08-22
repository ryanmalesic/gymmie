import { type UserType } from "@/lib/prisma/generated/zod/schemas";

export function UserList({
  users,
}: {
  users: Pick<UserType, "email" | "id" | "name">[];
}) {
  if (users.length === 0) {
    return <p>No users yet.</p>;
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}
