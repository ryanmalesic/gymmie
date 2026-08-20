'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function SocialSignIn(): React.ReactElement {
  const [error, setError] = useState<null | string>(null);
  const [pendingProvider, setPendingProvider] = useState<'apple' | 'google' | null>(null);

  async function signIn(provider: 'apple' | 'google'): Promise<void> {
    setError(null);
    setPendingProvider(provider);

    try {
      const { error: signInError } = await authClient.signIn.social({
        callbackURL: '/account',
        provider,
      });

      if (signInError) {
        setError(signInError.message ?? `Unable to sign in with ${provider}.`);
      }
    } catch {
      setError(`Unable to sign in with ${provider}.`);
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          disabled={pendingProvider !== null}
          onClick={() => void signIn('google')}
          type="button"
        >
          {pendingProvider === 'google' ? 'Connecting…' : 'Continue with Google'}
        </Button>
        <Button
          disabled={pendingProvider !== null}
          onClick={() => void signIn('apple')}
          type="button"
          variant="outline"
        >
          {pendingProvider === 'apple' ? 'Connecting…' : 'Continue with Apple'}
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
