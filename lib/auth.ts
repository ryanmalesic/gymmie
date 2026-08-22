import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { importPKCS8, SignJWT } from "jose";

import { getPrisma } from "@/lib/db";

const appleIssuer = "https://appleid.apple.com";
const sessionCacheAge = 5 * 60;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const appleEnvironmentVariables = [
  "APPLE_CLIENT_ID",
  "APPLE_TEAM_ID",
  "APPLE_KEY_ID",
  "APPLE_PRIVATE_KEY",
  "APPLE_APP_BUNDLE_ID",
];
const hasAppleConfiguration = appleEnvironmentVariables.every(
  (name) => process.env[name],
);
const hasPartialAppleConfiguration =
  appleEnvironmentVariables.some((name) => process.env[name]) &&
  !hasAppleConfiguration;

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

if (hasPartialAppleConfiguration) {
  throw new Error(
    `Apple sign-in requires: ${appleEnvironmentVariables.join(", ")}`,
  );
}

async function generateAppleClientSecret(): Promise<string> {
  const clientId = requiredEnvironmentVariable("APPLE_CLIENT_ID");
  const teamId = requiredEnvironmentVariable("APPLE_TEAM_ID");
  const keyId = requiredEnvironmentVariable("APPLE_KEY_ID");
  const privateKey = requiredEnvironmentVariable("APPLE_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
  const key = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience(appleIssuer)
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

const socialProviders = {
  google: {
    clientId: [
      process.env.GOOGLE_WEB_CLIENT_ID ?? "",
      process.env.GOOGLE_IOS_CLIENT_ID ?? "",
      process.env.GOOGLE_ANDROID_CLIENT_ID ?? "",
    ],
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  ...(hasAppleConfiguration
    ? {
        apple: async () => ({
          appBundleIdentifier: requiredEnvironmentVariable(
            "APPLE_APP_BUNDLE_ID",
          ),
          clientId: requiredEnvironmentVariable("APPLE_CLIENT_ID"),
          clientSecret: await generateAppleClientSecret(),
        }),
      }
    : {}),
};

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: false,
      joins: true,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql",
  }),
  plugins: [nextCookies()],
  secret: betterAuthSecret,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: sessionCacheAge,
      strategy: "jwe",
    },
  },
  socialProviders,
  trustedOrigins: [appleIssuer],
});
