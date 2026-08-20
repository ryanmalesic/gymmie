import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { importPKCS8, SignJWT } from 'jose';

import { prisma } from '@/lib/prisma';

async function generateAppleClientSecret(): Promise<string> {
  const clientId = requiredEnvironmentVariable('APPLE_CLIENT_ID');
  const teamId = requiredEnvironmentVariable('APPLE_TEAM_ID');
  const keyId = requiredEnvironmentVariable('APPLE_KEY_ID');
  const privateKey = requiredEnvironmentVariable('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKey, 'ES256');
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

const appleProvider =
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
    ? {
        apple: async () => ({
          clientId: requiredEnvironmentVariable('APPLE_CLIENT_ID'),
          clientSecret: await generateAppleClientSecret(),
        }),
      }
    : {};

const authBaseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: false,
      joins: true,
    },
  },
  appName: 'Gymmie',
  baseURL: authBaseURL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [nextCookies()],
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: 'jwe',
    },
    expiresIn: 60 * 60 * 24 * 7,
    freshAge: 60 * 60 * 24,
    updateAge: 60 * 60 * 24,
  },
  socialProviders: {
    ...appleProvider,
    ...googleProvider,
  },
  trustedOrigins: [authBaseURL, 'https://appleid.apple.com'],
  user: {
    deleteUser: {
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
