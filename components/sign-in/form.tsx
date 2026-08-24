"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { AppleIcon } from "@/components/sign-in/apple-icon";
import { GoogleIcon } from "@/components/sign-in/google-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { getSafeCallbackPath } from "@/lib/auth/session";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackPath(searchParams.get("callbackUrl"), "");
  const [isPending, setIsPending] = useState(false);
  const [signInError, setSignInError] = useState<Error | null>(null);

  async function handleSocialSignIn(provider: "apple" | "google") {
    setIsPending(true);
    setSignInError(null);

    try {
      await authClient.signIn.social(
        { callbackURL: callbackUrl, provider },
        {
          onError: ({ error }) => {
            setSignInError(
              new Error("Unable to sign in. Please try again.", {
                cause: error,
              }),
            );
          },
        },
      );
    } catch (error) {
      setSignInError(
        new Error("Unable to sign in. Please try again.", { cause: error }),
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
          <CardDescription>Sign in to access Gymmie.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            className="w-full gap-2"
            disabled={isPending}
            onClick={() => handleSocialSignIn("google")}
            size="lg"
            variant="outline"
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </Button>
          <Button
            className="w-full gap-2 bg-black text-white hover:bg-black/90"
            disabled={isPending}
            onClick={() => handleSocialSignIn("apple")}
            size="lg"
          >
            <AppleIcon className="size-5" />
            Continue with Apple
          </Button>
        </CardContent>
        <CardFooter>
          {signInError ? (
            <Alert variant="destructive">
              <AlertDescription>{signInError.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardFooter>
      </Card>
    </main>
  );
}
