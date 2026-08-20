'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

type LinkedAccount = {
  id: string;
  providerId: string;
};

export function AccountPanel(): React.ReactElement {
  const router = useRouter();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    let isMounted = true;

    void authClient
      .listAccounts()
      .then(({ data, error: accountsError }) => {
        if (!isMounted) {
          return;
        }

        if (accountsError) {
          setError(accountsError.message ?? 'Unable to load linked accounts.');
        } else {
          setAccounts(data ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to load linked accounts.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAccounts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function signOut(): Promise<void> {
    setError(null);
    setIsSigningOut(true);

    try {
      const { error: signOutError } = await authClient.signOut();

      if (signOutError) {
        setError(signOutError.message ?? 'Unable to sign out.');
        return;
      }

      router.push('/');
    } catch {
      setError('Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="font-medium">Linked accounts</h2>
        {isLoadingAccounts ? <p className="text-muted-foreground text-sm">Loading…</p> : null}
        {!isLoadingAccounts && accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No linked accounts found.</p>
        ) : null}
        {accounts.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {accounts.map((account) => (
              <li className="rounded-md border px-3 py-2" key={account.id}>
                {account.providerId}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        disabled={isSigningOut}
        onClick={() => void signOut()}
        type="button"
        variant="outline"
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
