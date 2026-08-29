import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session.server";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireSession("/dashboard");
  redirect("/dashboard");
}
