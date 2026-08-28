import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { requireSession } from "@/lib/auth/session.server";

export const dynamic = "force-dynamic";

const SPEC_PATH = path.join(process.cwd(), "lib/openapi.yaml");

export async function GET() {
  await requireSession("/docs");
  const spec = await readFile(SPEC_PATH, "utf-8");
  return new NextResponse(spec, {
    headers: {
      "content-type": "application/yaml; charset=utf-8",
    },
  });
}
