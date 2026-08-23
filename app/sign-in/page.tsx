import { Suspense } from "react";

import SignInForm from "@/app/sign-in/sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
