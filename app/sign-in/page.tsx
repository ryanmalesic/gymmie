"use client";

import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/users";
  const isFreshRequired = searchParams.get("fresh") === "1";

  function handleGoogleSignIn() {
    authClient.signIn.social({
      callbackURL: callbackUrl,
      provider: "google",
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            {isFreshRequired ? "Re-authenticate" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {isFreshRequired
              ? "This action requires a fresh session. Please sign in again to continue."
              : "Sign in to access Gymmie."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleGoogleSignIn}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
