export type UserProfileCheckable = null | undefined | UserProfileCheckableObj;

export interface UserProfileCheckableObj {
  addressLine1?: null | string;
  addressLine2?: null | string;
  city?: null | string;
  country?: null | string;
  latitude?: null | number;
  longitude?: null | number;
  phone?: null | string;
  postalCode?: null | string;
  state?: null | string;
  stripeAccountId?: null | string;
  stripeAccountStatus?: null | string;
  timezone?: null | string;
}

export function canCreateLocation(user: UserProfileCheckable): boolean {
  if (!user) {
    return false;
  }

  return (
    isProfileComplete(user) &&
    Boolean(user.stripeAccountId?.trim()) &&
    user.stripeAccountStatus === "ACTIVATED"
  );
}

export function isProfileComplete(user: UserProfileCheckable): boolean {
  if (!user) {
    return false;
  }

  const {
    addressLine1,
    city,
    country,
    latitude,
    longitude,
    phone,
    postalCode,
    state,
    timezone,
  } = user;

  return Boolean(
    phone?.trim() &&
    addressLine1?.trim() &&
    city?.trim() &&
    state?.trim() &&
    postalCode?.trim() &&
    country?.trim() &&
    timezone?.trim() &&
    typeof latitude === "number" &&
    !Number.isNaN(latitude) &&
    typeof longitude === "number" &&
    !Number.isNaN(longitude),
  );
}
