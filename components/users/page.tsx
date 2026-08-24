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
import { Skeleton } from "@/components/ui/skeleton";
import { userColumns } from "@/components/users/columns";
import { UserTable } from "@/components/users/data-table";
import { UserForm } from "@/components/users/form";
import { getUserActionErrorMessage } from "@/lib/users/errors";
import {
  type UsersQueryInitialState,
  useUsersQuery,
} from "@/lib/users/queries";

type UsersPageProps = {
  initialState?: UsersQueryInitialState;
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
            <div
              aria-label="Loading people"
              aria-live="polite"
              className="space-y-3"
              role="status"
            >
              <Skeleton className="h-7 w-full max-w-sm" />
              <div className="overflow-hidden rounded-md border">
                <div className="grid grid-cols-2 gap-4 border-b p-2">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                </div>
                {["first", "second", "third"].map((row) => (
                  <div
                    className="grid grid-cols-2 gap-4 border-b p-2 last:border-b-0"
                    key={row}
                  >
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                  </div>
                ))}
              </div>
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Unable to load people</AlertTitle>
              <AlertDescription>
                {error ? getUserActionErrorMessage(error) : null}
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
