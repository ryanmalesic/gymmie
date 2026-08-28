import { type NextRequest, NextResponse } from "next/server";

import { getCommand } from "@/domain";
import { toErrorResponse } from "@/lib/commands/errors";
import { executeCommand } from "@/lib/commands/execute";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ command: string; version: string }> },
) {
  const { command, version } = await params;

  const commandModule = await getCommand(command, version);
  if (!commandModule) {
    return NextResponse.json(
      {
        code: "NOT_FOUND",
        error: `RPC Command '${command}' for version '${version}' not found.`,
        success: false,
      },
      {
        headers: {
          "x-rpc-command": command,
          "x-rpc-version": version,
        },
        status: 404,
      },
    );
  }

  const { spec } = commandModule;

  try {
    let rawBody: unknown = {};
    try {
      rawBody = await request.json();
    } catch {
      // Empty or non-JSON body defaults to empty object
    }

    const data = await executeCommand(commandModule, rawBody, request.headers);

    return NextResponse.json(data, {
      headers: {
        "x-rpc-command": spec.name,
        "x-rpc-version": spec.version,
      },
      status: spec.spec.response.status,
    });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(
      {
        code: errorResponse.code,
        error: errorResponse.error,
        fieldErrors: errorResponse.fieldErrors,
        success: false,
      },
      {
        headers: {
          "x-rpc-command": spec.name,
          "x-rpc-version": spec.version,
        },
        status: errorResponse.status,
      },
    );
  }
}
