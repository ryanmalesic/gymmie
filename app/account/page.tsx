import { AccountPanel } from '@/components/auth/account-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireServerSession } from '@/lib/session';

export default async function AccountPage(): Promise<React.ReactElement> {
  const session = await requireServerSession();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, {session.user.name}</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountPanel />
        </CardContent>
      </Card>
    </main>
  );
}
