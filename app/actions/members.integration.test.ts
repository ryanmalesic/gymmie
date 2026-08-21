import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { type MemberError } from '@/lib/members/errors';
import { createPrismaClient } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

vi.mock('@/lib/session', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration('member actions integration (action -> service -> repository -> DB)', () => {
  let database: ReturnType<typeof createPrismaClient>;
  const testEmails: string[] = [];

  beforeAll(() => {
    database = createPrismaClient(databaseUrl!);
  });

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (testEmails.length > 0) {
      await database.user.deleteMany({ where: { email: { in: [...testEmails] } } });
      testEmails.length = 0;
    }
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  const mockedGetServerSession = vi.mocked(getServerSession);

  function mockAuthenticated(userId = 'test-user-id-12345') {
    mockedGetServerSession.mockResolvedValue({
      session: {
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        id: 'session-1',
        ipAddress: '127.0.0.1',
        token: 'test-token',
        updatedAt: new Date(),
        userAgent: 'test',
        userId,
      },
      user: {
        createdAt: new Date(),
        email: 'test@example.com',
        emailVerified: false,
        id: userId,
        name: 'Test User',
        updatedAt: new Date(),
      },
    });
    return userId;
  }

  function mockUnauthenticated() {
    mockedGetServerSession.mockResolvedValue(null);
  }

  async function getActions() {
    return await import('@/app/actions/members');
  }

  describe('getMembersAction', () => {
    test('returns members list', async () => {
      mockAuthenticated();
      const { getMembersAction } = await getActions();
      const members = await getMembersAction();
      expect(Array.isArray(members)).toBe(true);
    });

    test('throws unauthorized when not authenticated', async () => {
      mockUnauthenticated();
      const { getMembersAction } = await getActions();
      await expect(getMembersAction()).rejects.toMatchObject({
        code: 'unauthorized',
      } satisfies Partial<MemberError>);
    });
  });

  describe('createMemberAction', () => {
    test('creates a member with valid input', async () => {
      mockAuthenticated();
      const { createMemberAction } = await getActions();

      const email = `integration-action-${Date.now()}-create@example.com`;
      testEmails.push(email);

      const member = await createMemberAction({ email, name: 'Action Test' });

      expect(member).toMatchObject({
        email,
        emailVerified: false,
        image: null,
        name: 'Action Test',
      });
      expect(member.id).toBeTruthy();
      expect(member.id).not.toMatch(/^temp-/);
      expect(member.createdAt).toBeTruthy();
      expect(member.updatedAt).toBeTruthy();
      // Verify ISO datetime strings
      expect(() => new Date(member.createdAt)).not.toThrow();
      expect(() => new Date(member.updatedAt)).not.toThrow();
    });

    test('throws invalid error with missing name', async () => {
      mockAuthenticated();
      const { createMemberAction } = await getActions();

      await expect(
        createMemberAction({ email: 'valid@example.com', name: '' })
      ).rejects.toMatchObject({
        code: 'invalid',
      } satisfies Partial<MemberError>);
    });

    test('throws invalid error with invalid email', async () => {
      mockAuthenticated();
      const { createMemberAction } = await getActions();

      await expect(
        createMemberAction({ email: 'not-an-email', name: 'Valid Name' })
      ).rejects.toMatchObject({
        code: 'invalid',
      } satisfies Partial<MemberError>);
    });

    test('throws conflict error with duplicate email', async () => {
      mockAuthenticated();
      const { createMemberAction } = await getActions();

      const email = `integration-action-${Date.now()}-dup@example.com`;
      testEmails.push(email);

      await createMemberAction({ email, name: 'First' });
      await expect(createMemberAction({ email, name: 'Second' })).rejects.toMatchObject({
        code: 'conflict',
      } satisfies Partial<MemberError>);
    });

    test('throws unauthorized when not authenticated', async () => {
      mockUnauthenticated();
      const { createMemberAction } = await getActions();

      await expect(
        createMemberAction({ email: 'test@example.com', name: 'Test' })
      ).rejects.toMatchObject({
        code: 'unauthorized',
      } satisfies Partial<MemberError>);
    });
  });

  describe('updateMemberAction', () => {
    test('updates a member with valid input', async () => {
      mockAuthenticated();
      const { createMemberAction, updateMemberAction } = await getActions();

      const email = `integration-action-${Date.now()}-update@example.com`;
      const updatedEmail = `integration-action-${Date.now()}-updated@example.com`;
      testEmails.push(email, updatedEmail);

      const created = await createMemberAction({ email, name: 'Original' });
      const updated = await updateMemberAction({
        email: updatedEmail,
        id: created.id,
        name: 'Updated Name',
      });

      expect(updated).toMatchObject({
        email: updatedEmail,
        id: created.id,
        name: 'Updated Name',
      });
    });

    test('throws unauthorized when not authenticated', async () => {
      mockUnauthenticated();
      const { updateMemberAction } = await getActions();

      await expect(
        updateMemberAction({ email: 'test@example.com', id: 'some-id', name: 'Test' })
      ).rejects.toMatchObject({
        code: 'unauthorized',
      } satisfies Partial<MemberError>);
    });
  });

  describe('deleteMemberAction', () => {
    test('deletes a member successfully', async () => {
      mockAuthenticated();
      const { createMemberAction, deleteMemberAction, getMembersAction } = await getActions();

      const email = `integration-action-${Date.now()}-delete@example.com`;
      testEmails.push(email);

      const created = await createMemberAction({ email, name: 'To Delete' });
      const result = await deleteMemberAction({ id: created.id });

      expect(result).toMatchObject({ id: created.id });

      // Verify it is gone from DB
      const members = await getMembersAction();
      const found = members.find((m) => m.id === created.id);
      expect(found).toBeUndefined();
    });

    test('throws not_found for non-existent member', async () => {
      mockAuthenticated();
      const { deleteMemberAction } = await getActions();

      await expect(deleteMemberAction({ id: 'nonexistent-id-12345' })).rejects.toMatchObject({
        code: 'not_found',
      } satisfies Partial<MemberError>);
    });

    test('throws invalid when trying to delete own user id (self-delete prevention)', async () => {
      const userId = mockAuthenticated();
      const { deleteMemberAction } = await getActions();

      await expect(deleteMemberAction({ id: userId })).rejects.toMatchObject({
        code: 'invalid',
        message: 'You cannot remove your own account.',
      } satisfies Partial<MemberError>);
    });

    test('throws unauthorized when not authenticated', async () => {
      mockUnauthenticated();
      const { deleteMemberAction } = await getActions();

      await expect(deleteMemberAction({ id: 'some-id' })).rejects.toMatchObject({
        code: 'unauthorized',
      } satisfies Partial<MemberError>);
    });
  });
});
