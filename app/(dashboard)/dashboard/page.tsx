import { DashboardHome } from "@/components/dashboard/home";
import { requireSession } from "@/lib/auth/session.server";

export default async function DashboardRoute() {
  const session = await requireSession();

  return <DashboardHome user={session.user} />;
}
