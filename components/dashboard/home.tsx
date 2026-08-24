import Link from "next/link";

import { type DashboardUser } from "@/components/dashboard/user";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardHome({ user }: { user: DashboardUser }) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Welcome back, {user.name}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Add people and keep your gym roster current.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={cn(buttonVariants())} href="/users">
            View users
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
