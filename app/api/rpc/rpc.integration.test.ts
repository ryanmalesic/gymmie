import { type NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";

import {
  createLocationAction,
  deleteLocationAction,
  listMyLocationsAction,
  readLocationAction,
  updateLocationAction,
} from "@/app/actions/locations";
import {
  createUserAction,
  deleteUserAction,
  getMyUserAction,
  listUsersAction,
  onboardMeAction,
  readUserAction,
  updateUserAction,
} from "@/app/actions/users";
import { POST } from "@/app/api/rpc/[version]/[command]/route";
import { locationCommands } from "@/domain/locations";
import { userCommands } from "@/domain/users";
import { auth } from "@/lib/auth";
import { type AuthSession } from "@/lib/commands/types";
import { getPrisma } from "@/lib/db";

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

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    accountLinks: {
      create: vi.fn().mockResolvedValue({
        url: "https://connect.stripe.com/setup/s/mock_link",
      }),
    },
    accounts: {
      create: vi.fn().mockResolvedValue({
        id: "acct_mock_stripe_123",
      }),
    },
    webhooks: {
      constructEventAsync: vi.fn(),
    },
  }),
  stripeSecretKey: () => "sk_test_mock",
  stripeWebhookSecret: () => "whsec_mock",
}));

function gymPayload(overrides: Record<string, unknown> = {}) {
  return {
    addressLine1: "123 Main St",
    city: "San Francisco",
    email: "front-desk@ironworks.example",
    latitude: 37.7749,
    longitude: -122.4194,
    name: "Ironworks",
    phone: "+1 (415) 555-1234",
    postalCode: "94107",
    state: "CA" as const,
    type: "COMMERCIAL_GYM" as const,
    website: "https://ironworks.example",
    ...overrides,
  };
}

async function postRpc(spec: { name: string; version: string }, body: unknown) {
  const response = await POST(
    new Request(`http://localhost:3000/api/rpc/${spec.version}/${spec.name}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }) as NextRequest,
    {
      params: Promise.resolve({
        command: spec.name,
        version: spec.version,
      }),
    },
  );

  return {
    body: (await response.json()) as unknown,
    response,
  };
}

function setSessionUser(user: { email: string; id: string; name: string }) {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    session: testUserSession.session,
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
    },
  } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
}

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

  // 3. Get current user (as self)
  setSessionUser({
    email: createdUser.email,
    id: createdUser.id,
    name: createdUser.name,
  });

  const meResult = await getMyUserAction({});
  expect(meResult.success).toBe(true);
  if (!meResult.success) return;
  expect(meResult.data.id).toBe(createdUser.id);
  expect(meResult.data.email).toBe(email);

  // 4. Update User (as self)
  const updatedName = "Test User Updated";
  const updateResult = await updateUserAction({
    id: createdUser.id,
    name: updatedName,
  });
  expect(updateResult.success).toBe(true);
  if (!updateResult.success) return;
  expect(updateResult.data.name).toBe(updatedName);

  // 5. List Users
  const listResult = await listUsersAction({ page: 1, pageSize: 50 });
  expect(listResult.success).toBe(true);
  if (!listResult.success) return;
  expect(listResult.data.totalCount).toBeGreaterThan(0);
  expect(listResult.data.users.some((u) => u.id === createdUser.id)).toBe(true);

  // 6. Delete User
  const deleteResult = await deleteUserAction({ id: createdUser.id });
  expect(deleteResult.success).toBe(true);
  if (!deleteResult.success) return;
  expect(deleteResult.data.id).toBe(createdUser.id);

  // 7. Verify Deleted
  const verifyRead = await readUserAction({ id: createdUser.id });
  expect(verifyRead.success).toBe(false);
  if (!verifyRead.success) {
    expect(verifyRead.code).toBe("NOT_FOUND");
  }
});

test("HTTP RPC route handler executes commands with headers and status codes", async () => {
  const email = `http-rpc-${crypto.randomUUID()}@example.com`;
  const name = "HTTP RPC Tester";

  // Execute POST /api/rpc/2026-08-27/CreateUser
  const req = new Request(
    "http://localhost:3000/api/rpc/2026-08-27/CreateUser",
    {
      body: JSON.stringify({ email, name }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;

  const response = await POST(req, {
    params: Promise.resolve({
      command: "CreateUser",
      version: "2026-08-27",
    }),
  });

  expect(response.status).toBe(201);
  expect(response.headers.get("x-rpc-version")).toBe("2026-08-27");
  expect(response.headers.get("x-rpc-command")).toBe("CreateUser");

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
    "http://localhost:3000/api/rpc/2026-08-27/CreateUser",
    {
      body: JSON.stringify({ email: "invalid-not-an-email", name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;

  const invalidResponse = await POST(invalidReq, {
    params: Promise.resolve({
      command: "CreateUser",
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

test("full location command CRUD lifecycle via server actions", async () => {
  const email = `location-owner-${crypto.randomUUID()}@example.com`;
  const name = "Location Owner";

  const createUserResult = await createUserAction({ email, name });
  expect(createUserResult.success).toBe(true);
  if (!createUserResult.success) return;

  const owner = createUserResult.data;
  setSessionUser({ email: owner.email, id: owner.id, name: owner.name });

  // Initial location creation fails because profile is incomplete
  const initialCreate = await createLocationAction(gymPayload());
  expect(initialCreate.success).toBe(false);
  if (!initialCreate.success) {
    expect(initialCreate.code).toBe("FORBIDDEN");
  }

  // OnboardMe fails if profile is incomplete
  const initialOnboard = await onboardMeAction({});
  expect(initialOnboard.success).toBe(false);
  if (!initialOnboard.success) {
    expect(initialOnboard.code).toBe("FORBIDDEN");
  }

  // Complete profile
  const updateProfileResult = await updateUserAction({
    addressLine1: "123 Main St",
    city: "San Francisco",
    country: "US",
    id: owner.id,
    latitude: 37.7749,
    longitude: -122.4194,
    phone: "+1 (415) 555-1234",
    postalCode: "94107",
    state: "CA",
    timezone: "America/New_York",
  });
  expect(updateProfileResult.success).toBe(true);

  // OnboardMe succeeds now that profile is complete
  const onboardResult = await onboardMeAction({});
  expect(onboardResult.success).toBe(true);

  // Location creation still fails because stripe status is PENDING
  const pendingCreate = await createLocationAction(gymPayload());
  expect(pendingCreate.success).toBe(false);
  if (!pendingCreate.success) {
    expect(pendingCreate.code).toBe("FORBIDDEN");
  }

  // Activate Stripe account
  await getPrisma().user.update({
    data: { stripeAccountStatus: "ACTIVATED" },
    where: { id: owner.id },
  });

  const createResult = await createLocationAction(gymPayload());
  expect(createResult.success).toBe(true);
  if (!createResult.success) return;

  const created = createResult.data;
  expect(created.id).toBeDefined();
  expect(created.name).toBe("Ironworks");
  expect(created.ownerId).toBe(owner.id);
  expect(created.status).toBe("DRAFT");
  expect(created.country).toBe("US");
  expect(created.phone).toBe("+1 (415) 555-1234");

  const readResult = await readLocationAction({ id: created.id });
  expect(readResult.success).toBe(true);
  if (!readResult.success) return;
  expect(readResult.data.id).toBe(created.id);
  expect(readResult.data.name).toBe("Ironworks");

  const updateResult = await updateLocationAction({
    id: created.id,
    name: "Ironworks West",
  });
  expect(updateResult.success).toBe(true);
  if (!updateResult.success) return;
  expect(updateResult.data.name).toBe("Ironworks West");
  expect(updateResult.data.ownerId).toBe(owner.id);

  const listResult = await listMyLocationsAction({ page: 1, pageSize: 20 });
  expect(listResult.success).toBe(true);
  if (!listResult.success) return;
  expect(listResult.data.totalCount).toBe(1);
  expect(
    listResult.data.locations.some((location) => location.id === created.id),
  ).toBe(true);

  const deleteResult = await deleteLocationAction({ id: created.id });
  expect(deleteResult.success).toBe(true);
  if (!deleteResult.success) return;
  expect(deleteResult.data.id).toBe(created.id);
  expect(deleteResult.data.success).toBe(true);

  const verifyRead = await readLocationAction({ id: created.id });
  expect(verifyRead.success).toBe(false);
  if (!verifyRead.success) {
    expect(verifyRead.code).toBe("NOT_FOUND");
  }
});

test("HTTP RPC happy path covers every user and location command", async () => {
  const email = `rpc-owner-${crypto.randomUUID()}@example.com`;
  const name = "RPC Owner";

  const createUser = await postRpc(userCommands.createUser.spec, {
    email,
    name,
  });
  expect(createUser.response.status).toBe(201);
  expect(createUser.response.headers.get("x-rpc-command")).toBe("CreateUser");
  const createdUser = createUser.body as {
    email: string;
    id: string;
    name: string;
  };
  expect(createdUser.id).toBeDefined();
  expect(createdUser.email).toBe(email);

  setSessionUser(createdUser);

  const me = await postRpc(userCommands.getMyUser.spec, {});
  expect(me.response.status).toBe(200);
  expect(me.response.headers.get("x-rpc-command")).toBe("GetMyUser");
  expect(me.response.headers.get("x-rpc-version")).toBe(
    userCommands.getMyUser.spec.version,
  );
  const meBody = me.body as { email: string; id: string; name: string };
  expect(meBody.id).toBe(createdUser.id);
  expect(meBody.email).toBe(email);

  const readUser = await postRpc(userCommands.readUser.spec, {
    id: createdUser.id,
  });
  expect(readUser.response.status).toBe(200);
  expect(readUser.response.headers.get("x-rpc-command")).toBe("ReadUser");
  expect((readUser.body as { id: string }).id).toBe(createdUser.id);

  const updatedName = "RPC Owner Updated";
  const updateUser = await postRpc(userCommands.updateUser.spec, {
    addressLine1: "123 Main St",
    city: "San Francisco",
    country: "US",
    id: createdUser.id,
    latitude: 37.7749,
    longitude: -122.4194,
    name: updatedName,
    phone: "+1 (415) 555-1234",
    postalCode: "94107",
    state: "CA",
    timezone: "America/New_York",
  });
  expect(updateUser.response.status).toBe(200);
  expect(updateUser.response.headers.get("x-rpc-command")).toBe("UpdateUser");
  expect((updateUser.body as { name: string }).name).toBe(updatedName);

  const listUsers = await postRpc(userCommands.listUsers.spec, {
    page: 1,
    pageSize: 50,
  });
  expect(listUsers.response.status).toBe(200);
  expect(listUsers.response.headers.get("x-rpc-command")).toBe("ListUsers");
  const listUsersBody = listUsers.body as {
    totalCount: number;
    users: Array<{ id: string }>;
  };
  expect(listUsersBody.totalCount).toBeGreaterThan(0);
  expect(listUsersBody.users.some((user) => user.id === createdUser.id)).toBe(
    true,
  );

  const onboardMe = await postRpc(userCommands.onboardMe.spec, {});
  expect(onboardMe.response.status).toBe(200);
  expect(onboardMe.response.headers.get("x-rpc-command")).toBe("OnboardMe");
  const onboardBody = onboardMe.body as {
    accountLinkUrl: string;
    stripeAccountId: string;
  };
  expect(onboardBody.accountLinkUrl).toBeDefined();
  expect(onboardBody.stripeAccountId).toBe("acct_mock_stripe_123");

  // Activate Stripe status in database
  await getPrisma().user.update({
    data: { stripeAccountStatus: "ACTIVATED" },
    where: { id: createdUser.id },
  });

  const createLocation = await postRpc(
    locationCommands.createLocation.spec,
    gymPayload(),
  );
  expect(createLocation.response.status).toBe(201);
  expect(createLocation.response.headers.get("x-rpc-command")).toBe(
    "CreateLocation",
  );
  expect(createLocation.response.headers.get("x-rpc-version")).toBe(
    locationCommands.createLocation.spec.version,
  );
  const createdLocation = createLocation.body as {
    id: string;
    name: string;
    ownerId: string;
    phone: string;
    status: string;
  };
  expect(createdLocation.id).toBeDefined();
  expect(createdLocation.name).toBe("Ironworks");
  expect(createdLocation.ownerId).toBe(createdUser.id);
  expect(createdLocation.status).toBe("DRAFT");
  expect(createdLocation.phone).toBe("+1 (415) 555-1234");

  const readLocation = await postRpc(locationCommands.readLocation.spec, {
    id: createdLocation.id,
  });
  expect(readLocation.response.status).toBe(200);
  expect(readLocation.response.headers.get("x-rpc-command")).toBe(
    "ReadLocation",
  );
  expect((readLocation.body as { id: string }).id).toBe(createdLocation.id);

  const updateLocation = await postRpc(locationCommands.updateLocation.spec, {
    id: createdLocation.id,
    name: "Ironworks West",
  });
  expect(updateLocation.response.status).toBe(200);
  expect(updateLocation.response.headers.get("x-rpc-command")).toBe(
    "UpdateLocation",
  );
  const updatedLocation = updateLocation.body as {
    name: string;
    ownerId: string;
  };
  expect(updatedLocation.name).toBe("Ironworks West");
  expect(updatedLocation.ownerId).toBe(createdUser.id);

  const listLocations = await postRpc(locationCommands.listMyLocations.spec, {
    page: 1,
    pageSize: 20,
  });
  expect(listLocations.response.status).toBe(200);
  expect(listLocations.response.headers.get("x-rpc-command")).toBe(
    "ListMyLocations",
  );
  const listLocationsBody = listLocations.body as {
    locations: Array<{ id: string; name: string }>;
    totalCount: number;
  };
  expect(listLocationsBody.totalCount).toBe(1);
  expect(
    listLocationsBody.locations.some(
      (location) => location.id === createdLocation.id,
    ),
  ).toBe(true);
  expect(listLocationsBody.locations[0]?.name).toBe("Ironworks West");

  const deleteLocation = await postRpc(locationCommands.deleteLocation.spec, {
    id: createdLocation.id,
  });
  expect(deleteLocation.response.status).toBe(200);
  expect(deleteLocation.response.headers.get("x-rpc-command")).toBe(
    "DeleteLocation",
  );
  const deletedLocation = deleteLocation.body as {
    id: string;
    success: boolean;
  };
  expect(deletedLocation.id).toBe(createdLocation.id);
  expect(deletedLocation.success).toBe(true);

  const missingLocation = await postRpc(locationCommands.readLocation.spec, {
    id: createdLocation.id,
  });
  expect(missingLocation.response.status).toBe(404);
  expect((missingLocation.body as { code: string }).code).toBe("NOT_FOUND");

  const deleteUser = await postRpc(userCommands.deleteUser.spec, {
    id: createdUser.id,
  });
  expect(deleteUser.response.status).toBe(200);
  expect(deleteUser.response.headers.get("x-rpc-command")).toBe("DeleteUser");
  expect((deleteUser.body as { id: string; success: boolean }).success).toBe(
    true,
  );

  const missingUser = await postRpc(userCommands.readUser.spec, {
    id: createdUser.id,
  });
  expect(missingUser.response.status).toBe(404);
  expect((missingUser.body as { code: string }).code).toBe("NOT_FOUND");
});
