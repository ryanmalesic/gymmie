import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export type SessionData = typeof auth.$Infer.Session;

/** Retrieve the current session on the server (RSC / server action). */
export async function getSession(): Promise<null | SessionData> {
  return auth.api.getSession({
    headers: await headers(),
  });
}
