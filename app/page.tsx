import { AlertCircleIcon } from "lucide-react";

import { createUserAction, listUsersAction } from "@/app/users/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserForm } from "@/components/users/form";
import { UserList } from "@/components/users/list";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await listUsersAction();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Users
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Add user</CardTitle>
          <CardDescription>Name and email for each person.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm action={createUserAction} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          {users.ok ? (
            <UserList users={users.data} />
          ) : (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Unable to load people</AlertTitle>
              <AlertDescription>{users.error.form?.join(" ")}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
