import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import SignInPage from "@/app/sign-in/page";

const mocks = vi.hoisted(() => ({
  callbackCandidate: null as null | string | undefined,
  socialSignIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (name: string) =>
      name === "callbackUrl" ? mocks.callbackCandidate : null,
  }),
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signIn: {
      social: mocks.socialSignIn,
    },
  },
}));

afterEach(() => {
  cleanup();
  mocks.callbackCandidate = null;
  mocks.socialSignIn.mockReset();
});

const providers = [
  { button: "Continue with Google", provider: "google" },
  { button: "Continue with Apple", provider: "apple" },
] as const;

const validCallbackCandidates = Array.from({ length: 100 }, (_, index) => {
  if (index === 0) {
    return "";
  }

  if (index === 1) {
    return "users";
  }

  return `users/item-${index}/%E2%9C%93?q=alpha%2Bbeta&order=${index}%26${index}`;
});

const invalidCallbackCandidates: Array<null | string | undefined> = Array.from(
  { length: 100 },
  (_, index) => {
    switch (index % 8) {
      case 0:
        return null;
      case 1:
        return undefined;
      case 2:
        return "";
      case 3:
        return `//evil.example/users/${index}`;
      case 4:
        return `https://evil.example/users/${index}`;
      case 5:
        return `/users#fragment-${index}`;
      case 6:
        return `/users\\evil-${index}`;
      case 7:
        return `/users/${String.fromCharCode(1)}-${index}`;
      default:
        return `/users/${"a".repeat(2049)}`;
    }
  },
);

test("renders the public sign-in page without a session", () => {
  render(<SignInPage />);

  expect(screen.getByText("Sign in", { selector: "div" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue with Apple" }),
  ).toBeVisible();
});

test.each(providers)(
  "reinserts leading slash for every valid callback to $provider",
  ({ button, provider }) => {
    for (const callbackCandidate of validCallbackCandidates) {
      mocks.callbackCandidate = callbackCandidate;
      render(<SignInPage />);

      fireEvent.click(screen.getByRole("button", { name: button }));

      const expectedCallbackURL =
        callbackCandidate && !callbackCandidate.startsWith("/")
          ? `/${callbackCandidate}`
          : callbackCandidate;

      expect(mocks.socialSignIn).toHaveBeenCalledWith(
        {
          callbackURL: expectedCallbackURL,
          provider,
        },
        { onError: expect.any(Function) },
      );

      cleanup();
      mocks.socialSignIn.mockReset();
    }
  },
);

test.each(providers)(
  "replaces every invalid or missing callback with / for $provider",
  ({ button, provider }) => {
    for (const callbackCandidate of invalidCallbackCandidates) {
      mocks.callbackCandidate = callbackCandidate;
      render(<SignInPage />);

      fireEvent.click(screen.getByRole("button", { name: button }));

      expect(mocks.socialSignIn).toHaveBeenCalledWith(
        {
          callbackURL: "",
          provider,
        },
        { onError: expect.any(Function) },
      );

      cleanup();
      mocks.socialSignIn.mockReset();
    }
  },
);

test("disables both provider buttons while sign-in is pending", async () => {
  let resolveSignIn!: (value: unknown) => void;
  mocks.socialSignIn.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveSignIn = resolve;
    }),
  );

  render(<SignInPage />);
  fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Continue with Apple" }),
  ).toBeDisabled();

  resolveSignIn({ data: null, error: null });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled(),
  );
});

test("renders a provider error from Better Auth", async () => {
  mocks.socialSignIn.mockImplementationOnce((_input, options) => {
    options.onError({ error: new Error("provider unavailable") });
    return Promise.resolve({ data: null, error: null });
  });

  render(<SignInPage />);
  fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

  expect(
    await screen.findByText("Unable to sign in. Please try again."),
  ).toBeInTheDocument();
});

test("renders a rejected provider request", async () => {
  mocks.socialSignIn.mockRejectedValueOnce(new Error("network unavailable"));

  render(<SignInPage />);
  fireEvent.click(screen.getByRole("button", { name: "Continue with Apple" }));

  expect(
    await screen.findByText("Unable to sign in. Please try again."),
  ).toBeInTheDocument();
});
