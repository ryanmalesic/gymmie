import { CreditCardIcon, UsersIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    description: "Keep a clean roster of everyone who trains at your gym.",
    icon: UsersIcon,
    title: "Members",
  },
  {
    description: "See who belongs, follow up, and stay organized as you grow.",
    icon: CreditCardIcon,
    title: "Memberships",
  },
  {
    description: "Give staff one place to look up people and add new faces.",
    icon: UsersRoundIcon,
    title: "Community",
  },
];

export function LandingPage({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
      <section className="flex max-w-xl flex-col gap-6">
        <h1 className="text-4xl font-bold tracking-tight">Gymmie</h1>
        <p className="text-lg text-muted-foreground">
          Track gym users, manage memberships, and keep your community
          organized.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className={cn(buttonVariants({ size: "lg" }))}
            href="/dashboard"
          >
            {isSignedIn ? "Open dashboard" : "Get started"}
          </Link>
          {isSignedIn ? null : (
            <Link
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
              )}
              href="/sign-in"
            >
              Sign in
            </Link>
          )}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="size-4 text-muted-foreground" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
