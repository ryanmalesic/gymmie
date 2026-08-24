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
import { userColumns } from "@/components/users/columns";
import { UserForm } from "@/components/users/form";
import { UserTable, UserTableSkeleton } from "@/components/users/table";
import { type ActionResult } from "@/lib/action";
import { useUsersQuery } from "@/lib/users/queries";
import { type User } from "@/lib/users/schema";

type UsersPageProps = {
  initialState?: ActionResult<User[]>;
};

export function UsersPage({ initialState }: UsersPageProps) {
  const { data, error, isError, isPending } = useUsersQuery(initialState);

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
          <UserForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <UserTableSkeleton />
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Unable to load people</AlertTitle>
              <AlertDescription>
                {error?.error.form?.join(" ")}
              </AlertDescription>
            </Alert>
          ) : (
            <UserTable columns={userColumns} data={data ?? []} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
