import { createUserAction, listUsersAction } from "@/app/users/actions";
import { UserForm } from "@/components/users/form";
import { UserList } from "@/components/users/list";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await listUsersAction();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
      <UserForm action={createUserAction} />
      {users.ok ? (
        <UserList users={users.data} />
      ) : (
        <p role="alert">{users.error.form?.join(" ")}</p>
      )}
    </main>
  );
}
