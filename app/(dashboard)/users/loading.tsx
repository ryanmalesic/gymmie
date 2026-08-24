import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTableSkeleton } from "@/components/users/table";

export default function UsersLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-9 w-32" />
      <Card>
        <CardHeader>
          <CardTitle>Add user</CardTitle>
          <CardDescription>Name and email for each person.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
