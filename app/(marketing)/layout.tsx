import { MarketingLayout } from "@/components/marketing/layout";
import { getSession } from "@/lib/auth/session.server";

export default async function MarketingRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <MarketingLayout isSignedIn={session !== null}>{children}</MarketingLayout>
  );
}
