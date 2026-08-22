"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { columns } from "@/components/users/columns";
import { DataTable } from "@/components/users/data-table";
import { UserForm } from "@/components/users/form";
import { type ActionResult } from "@/lib/action";
import { type ListedUser, useUsersQuery } from "@/lib/users/queries";
import { type UserInput } from "@/lib/users/schema";

export function UsersPage({
  listAction,
  mutationAction,
}: {
  listAction: () => Promise<ActionResult<ListedUser[]>>;
  mutationAction: (
    input: UserInput,
  ) => Promise<ActionResult<ListedUser, UserInput>>;
}) {
  const { data, error, isError } = useUsersQuery(listAction);

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
          <UserForm action={mutationAction} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Unable to load people</AlertTitle>
              <AlertDescription>{error?.message}</AlertDescription>
            </Alert>
          ) : (
            <DataTable columns={columns} data={data ?? []} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
