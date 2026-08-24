import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">Gymmie</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Track gym users, manage memberships, and keep your community
          organized.
        </p>
      </div>
      <div className="flex gap-3">
        <Link className={cn(buttonVariants({ size: "lg" }))} href="/users">
          Get started
        </Link>
        <Link
          className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
          href="/sign-in"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
