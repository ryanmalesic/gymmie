import { Suspense } from "react";

import { SignInPage } from "@/components/sign-in";

export default function SignInRoute() {
  return (
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  );
}
