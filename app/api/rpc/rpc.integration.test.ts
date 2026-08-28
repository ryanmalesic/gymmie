import { type NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";

import {
  createUserAction,
  deleteUserAction,
  listUsersAction,
  readUserAction,
  updateUserAction,
} from "@/app/actions/users";
import { POST } from "@/app/api/rpc/[version]/[command]/route";
import { auth } from "@/lib/auth";
import { type AuthSession } from "@/lib/commands/types";

const testUserSession: AuthSession = {
  session: {
    expiresAt: new Date(Date.now() + 3600000),
    id: "sess_integration",
  },
  user: {
    email: "integration-tester@example.com",
    id: "usr_integration_1",
    name: "Integration Tester",
  },
};

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.api.getSession).mockResolvedValue(
    testUserSession as unknown as Awaited<
      ReturnType<typeof auth.api.getSession>
    >,
  );
});

test("full user command CRUD lifecycle via server actions", async () => {
  const email = `test-user-${crypto.randomUUID()}@example.com`;
  const name = "Test User Integration";

  // 1. Create User
  const createResult = await createUserAction({ email, name });
  expect(createResult.success).toBe(true);
  if (!createResult.success) return;

  const createdUser = createResult.data;
  expect(createdUser.id).toBeDefined();
  expect(createdUser.email).toBe(email);
  expect(createdUser.name).toBe(name);

  // 2. Read User
  const readResult = await readUserAction({ id: createdUser.id });
  expect(readResult.success).toBe(true);
  if (!readResult.success) return;
  expect(readResult.data.id).toBe(createdUser.id);
  expect(readResult.data.email).toBe(email);

  // 3. Update User (as self)
  const selfSession: AuthSession = {
    session: testUserSession.session,
    user: { ...testUserSession.user, id: createdUser.id },
  };
  vi.mocked(auth.api.getSession).mockResolvedValue(
    selfSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
  );

  const updatedName = "Test User Updated";
  const updateResult = await updateUserAction({
    id: createdUser.id,
    name: updatedName,
  });
  expect(updateResult.success).toBe(true);
  if (!updateResult.success) return;
  expect(updateResult.data.name).toBe(updatedName);

  // 4. List Users
  const listResult = await listUsersAction({ page: 1, pageSize: 50 });
  expect(listResult.success).toBe(true);
  if (!listResult.success) return;
  expect(listResult.data.totalCount).toBeGreaterThan(0);
  expect(listResult.data.users.some((u) => u.id === createdUser.id)).toBe(true);

  // 5. Delete User
  const deleteResult = await deleteUserAction({ id: createdUser.id });
  expect(deleteResult.success).toBe(true);
  if (!deleteResult.success) return;
  expect(deleteResult.data.id).toBe(createdUser.id);

  // 6. Verify Deleted
  const verifyRead = await readUserAction({ id: createdUser.id });
  expect(verifyRead.success).toBe(false);
  if (!verifyRead.success) {
    expect(verifyRead.code).toBe("NOT_FOUND");
  }
});

test("HTTP RPC route handler executes commands with headers and status codes", async () => {
  const email = `http-rpc-${crypto.randomUUID()}@example.com`;
  const name = "HTTP RPC Tester";

  // Execute POST /api/rpc/2026-08-27/createUser
  const req = new Request(
    "http://localhost:3000/api/rpc/2026-08-27/createUser",
    {
      body: JSON.stringify({ email, name }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;

  const response = await POST(req, {
    params: Promise.resolve({
      command: "createUser",
      version: "2026-08-27",
    }),
  });

  expect(response.status).toBe(201);
  expect(response.headers.get("x-rpc-version")).toBe("2026-08-27");
  expect(response.headers.get("x-rpc-command")).toBe("createUser");

  const body = (await response.json()) as {
    createdAt: string;
    email: string;
    id: string;
    name: string;
  };
  expect(body.email).toBe(email);
  expect(body.name).toBe(name);
  expect(body.id).toBeDefined();

  // Test invalid schema failure returns 422 with ErrorResponse schema
  const invalidReq = new Request(
    "http://localhost:3000/api/rpc/2026-08-27/createUser",
    {
      body: JSON.stringify({ email: "invalid-not-an-email", name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;

  const invalidResponse = await POST(invalidReq, {
    params: Promise.resolve({
      command: "createUser",
      version: "2026-08-27",
    }),
  });

  expect(invalidResponse.status).toBe(422);
  const errorBody = (await invalidResponse.json()) as {
    code: string;
    error: string;
    fieldErrors?: Record<string, string[]>;
  };
  expect(errorBody.code).toBe("SCHEMA_VALIDATION_FAILED");
  expect(errorBody.fieldErrors).toBeDefined();

  // Test unknown command returns 404
  const unknownReq = new Request(
    "http://localhost:3000/api/rpc/2026-08-27/unknownCommand",
    {
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;

  const unknownResponse = await POST(unknownReq, {
    params: Promise.resolve({
      command: "unknownCommand",
      version: "2026-08-27",
    }),
  });

  expect(unknownResponse.status).toBe(404);
});
