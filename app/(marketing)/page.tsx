import { LandingPage } from "@/components/marketing/landing";
import { getSession } from "@/lib/auth/session.server";

export default async function HomeRoute() {
  const session = await getSession();

  return <LandingPage isSignedIn={session !== null} />;
}
