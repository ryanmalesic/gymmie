import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { requireSession } from "@/lib/auth/session.server";

export const dynamic = "force-dynamic";

const distDir = path.join(process.cwd(), "node_modules/swagger-ui-dist");

const assets: Record<string, string> = {
  "favicon-16x16.png": "image/png",
  "favicon-32x32.png": "image/png",
  "swagger-ui-bundle.js": "text/javascript; charset=utf-8",
  "swagger-ui.css": "text/css; charset=utf-8",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ asset: string }> },
) {
  await requireSession("/docs");
  const { asset } = await context.params;
  const contentType = assets[asset];
  if (!contentType) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await readFile(path.join(distDir, asset));
  return new NextResponse(file, {
    headers: {
      "content-type": contentType,
    },
  });
}
