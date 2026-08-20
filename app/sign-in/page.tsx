import Link from 'next/link';

import { SocialSignIn } from '@/components/auth/social-sign-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage(): React.ReactElement {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Gymmie</CardTitle>
          <CardDescription>
            Use a trusted provider to access your fitness companion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SocialSignIn />
          <p className="text-muted-foreground text-center text-xs">
            By continuing, you agree to the account and provider terms configured for Gymmie.
          </p>
          <Link className="text-muted-foreground block text-center text-sm underline" href="/">
            Return home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
