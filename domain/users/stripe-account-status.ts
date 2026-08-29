type ConfigurationName = "merchant" | "recipient";

type UnknownRecord = Record<string, unknown>;

export const requiredStripeV2Capabilities = [
  ["merchant", "capabilities", "card_payments"],
  ["merchant", "capabilities", "us_bank_account_ach_payments"],
  ["merchant", "capabilities", "stripe_balance", "payouts"],
  ["recipient", "capabilities", "stripe_balance", "stripe_transfers"],
] as const satisfies readonly (readonly [ConfigurationName, ...string[]])[];

const ACTIVE_CAPABILITY_STATES = new Set([
  "accepted",
  "activated",
  "active",
  "complete",
  "enabled",
]);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const isNonEmptyArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length > 0;

const normalized = (value: string) => value.toLowerCase().replace(/[-.]/g, "_");

export type StripeAccountStatus =
  "ACTIVATED" | "DISABLED" | "PENDING" | "RESTRICTED";

export function mapStripeV2AccountStatus(
  account: UnknownRecord,
): StripeAccountStatus {
  const requirementStates = collectRequirementStates(account.requirements);
  if (hasDisabledV2State(account, requirementStates)) {
    return "DISABLED";
  }

  const requiredStates = requiredStripeV2Capabilities.map((path) =>
    getCapabilityState(account, path),
  );
  if (
    requiredStates.some(
      (state) =>
        state === "disabled" ||
        state === "rejected" ||
        state.startsWith("rejected_") ||
        state.startsWith("listed_"),
    )
  ) {
    return "DISABLED";
  }

  if (
    hasRestrictedAccountState(account, requirementStates) ||
    requiredStates.some((state) => state === "restricted")
  ) {
    return "RESTRICTED";
  }

  if (
    requiredStates.some(
      (state) =>
        state === "pending" ||
        state === "required" ||
        state === "unknown" ||
        !ACTIVE_CAPABILITY_STATES.has(state),
    ) ||
    requirementStates.some(
      (state) =>
        state === "required" ||
        state === "pending" ||
        state.includes("currently_due") ||
        state.includes("eventually_due") ||
        state.includes("pending_verification"),
    )
  ) {
    return "PENDING";
  }

  return "ACTIVATED";
}

function collectRequirementStates(value: unknown, states: string[] = []) {
  if (Array.isArray(value)) {
    if (value.length > 0) {
      states.push("required");
    }
    for (const item of value) {
      collectRequirementStates(item, states);
    }
    return states;
  }

  if (!isRecord(value)) {
    return states;
  }

  for (const [key, child] of Object.entries(value)) {
    const keyName = normalized(key);
    if (typeof child === "string") {
      if (
        keyName === "state" ||
        keyName === "status" ||
        keyName === "disabled_reason"
      ) {
        states.push(normalized(child));
      } else if (isRequirementStateKey(keyName)) {
        states.push(keyName);
      }
    } else if (isRequirementStateKey(keyName) && isNonEmptyArray(child)) {
      states.push(keyName);
    }
    collectRequirementStates(child, states);
  }

  return states;
}

function getCapabilityState(
  account: UnknownRecord,
  path: readonly [ConfigurationName, ...string[]],
) {
  let current: unknown = account.configuration;
  for (const segment of path) {
    if (!isRecord(current)) {
      return "unknown";
    }
    current = current[segment];
  }

  if (!isRecord(current)) {
    return "unknown";
  }

  const state = current.status ?? current.state;
  return typeof state === "string" ? normalized(state) : "unknown";
}

function hasDisabledV2State(
  account: UnknownRecord,
  requirementStates: string[],
) {
  const accountStatus = account.status;
  if (
    typeof accountStatus === "string" &&
    ["disabled", "rejected"].includes(normalized(accountStatus))
  ) {
    return true;
  }

  const requirements = account.requirements;
  if (isRecord(requirements)) {
    const reason = requirements.disabled_reason;
    if (
      typeof reason === "string" &&
      (normalized(reason).startsWith("rejected_") ||
        normalized(reason).startsWith("listed_") ||
        normalized(reason) === "disabled")
    ) {
      return true;
    }
  }

  return requirementStates.some(
    (state) =>
      state === "disabled" ||
      state === "rejected" ||
      state.startsWith("rejected_") ||
      state.startsWith("listed_"),
  );
}

function hasRestrictedAccountState(
  account: UnknownRecord,
  requirementStates: string[],
) {
  return (
    requirementStates.some(
      (state) =>
        state === "restricted" ||
        state === "past_due" ||
        state.includes("past_due"),
    ) ||
    (typeof account.status === "string" &&
      normalized(account.status) === "restricted")
  );
}

function isRequirementStateKey(value: string) {
  return (
    value.includes("past_due") ||
    value.includes("currently_due") ||
    value.includes("eventually_due") ||
    value.includes("pending_verification") ||
    value === "pending" ||
    value === "restricted"
  );
}
