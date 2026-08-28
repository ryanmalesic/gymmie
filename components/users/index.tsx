"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserForm } from "@/components/users/form";
import { UserTable, UserTableSkeleton } from "@/components/users/table";
import { userColumns } from "@/components/users/table/columns";
import { UsersView } from "@/components/users/view";
import { type User } from "@/domain/users/schema";
import { useUsersQuery } from "@/hooks/users";
import { type ActionResult } from "@/lib/commands/types";

type UsersPageProps = {
  initialState?: ActionResult<{ users: User[] }>;
};

export function UsersPage({ initialState }: UsersPageProps) {
  const { data, error, isError, isPending } = useUsersQuery(initialState);

  return (
    <UsersView
      form={<UserForm />}
      people={
        isPending ? (
          <UserTableSkeleton />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Unable to load people</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        ) : (
          <UserTable columns={userColumns} data={data ?? []} />
        )
      }
    />
  );
}
