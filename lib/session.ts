import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth, type Session } from '@/lib/auth';

export async function getServerSession(): Promise<null | Session> {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireServerSession(): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  return session;
}
