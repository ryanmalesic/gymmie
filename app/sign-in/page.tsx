"use client";

import { useSearchParams } from "next/navigation";

import { AppleIcon } from "@/components/icons/apple";
import { GoogleIcon } from "@/components/icons/google";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

  function handleAppleSignIn() {
    authClient.signIn.social({
      callbackURL: callbackUrl,
      provider: "apple",
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
        <CardContent className="flex flex-col gap-4">
          <Button
            className="w-full gap-2"
            onClick={handleGoogleSignIn}
            size="lg"
            variant="outline"
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <Button
            className="w-full gap-2 bg-black text-white hover:bg-black/90"
            onClick={handleAppleSignIn}
            size="lg"
          >
            <AppleIcon className="size-5" />
            Continue with Apple
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
