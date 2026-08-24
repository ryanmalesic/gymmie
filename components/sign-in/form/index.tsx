"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { AppleIcon } from "@/components/sign-in/form/apple-icon";
import { GoogleIcon } from "@/components/sign-in/form/google-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";
import { DEFAULT_CALLBACK_PATH, getSafeCallbackPath } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackPath(
    searchParams.get("callbackUrl"),
    DEFAULT_CALLBACK_PATH,
  );
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <Button
                disabled={isPending}
                onClick={() => handleSocialSignIn("apple")}
                type="button"
                variant="outline"
              >
                <AppleIcon />
                Login with Apple
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleSocialSignIn("google")}
                type="button"
                variant="outline"
              >
                <GoogleIcon />
                Login with Google
              </Button>
            </Field>
            {signInError ? (
              <Alert variant="destructive">
                <AlertDescription>{signInError.message}</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </FieldDescription>
    </div>
  );
}
