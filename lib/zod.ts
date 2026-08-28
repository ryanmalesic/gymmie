import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const WireDateTime = z
  .union([
    z.date(),
    z.iso
      .datetime({ message: "Must be an ISO 8601 UTC timestamp" })
      .pipe(z.coerce.date()),
  ])
  .openapi({
    description: "ISO 8601 UTC Timestamp",
    example: "2026-08-27T21:57:51.000Z",
    format: "date-time",
    type: "string",
  });

export const WireInt = (min = 1, max = 100) =>
  z
    .union([
      z.number().int().min(min).max(max),
      z
        .string()
        .regex(/^\d+$/, { message: "Must be an unsigned integer string" })
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(min).max(max)),
    ])
    .openapi({
      example: 20,
      maximum: max,
      minimum: min,
      type: "integer",
    });

export const WireBool = z
  .union([
    z.boolean(),
    z
      .enum(["true", "false", "1", "0"])
      .transform((val) => val === "true" || val === "1")
      .pipe(z.boolean()),
  ])
  .openapi({
    example: true,
    type: "boolean",
  });

export const Email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Email is invalid" }))
  .openapi({
    description: "Email address",
    example: "ada@example.com",
    format: "email",
    type: "string",
  });

export const HttpsUrl = z
  .url({ message: "Must be a valid URL" })
  .trim()
  .refine((val) => val.startsWith("https://"), {
    message: "Must be a secure HTTPS URL",
  })
  .openapi({
    description: "Secure HTTPS URL",
    example: "https://example.com/image.png",
    format: "uri",
    type: "string",
  });

const ianaTimezones = new Set(Intl.supportedValuesOf("timeZone"));

export const IanaTimezone = z
  .string()
  .trim()
  .refine((value) => ianaTimezones.has(value), {
    message: "Timezone is invalid",
  })
  .openapi({
    description: "IANA time zone",
    example: "America/New_York",
    type: "string",
  });

export const IsoCountry = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, { message: "Country is invalid" })
  .openapi({
    description: "ISO 3166-1 alpha-2 country code",
    example: "US",
    type: "string",
  });

export const Latitude = z
  .number()
  .finite()
  .min(-90, { message: "Latitude is invalid" })
  .max(90, { message: "Latitude is invalid" })
  .openapi({
    description: "Latitude in decimal degrees",
    example: 37.7749,
    type: "number",
  });

export const Longitude = z
  .number()
  .finite()
  .min(-180, { message: "Longitude is invalid" })
  .max(180, { message: "Longitude is invalid" })
  .openapi({
    description: "Longitude in decimal degrees",
    example: -122.4194,
    type: "number",
  });

const nanpSubscriber = /^[2-9]\d{2}[2-9]\d{6}$/;

export const UsPhone = z
  .string()
  .trim()
  .transform((value, context) => {
    const digits = value.replaceAll(/\D/g, "");
    const subscriber =
      digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

    if (subscriber.length !== 10 || !nanpSubscriber.test(subscriber)) {
      context.addIssue({ code: "custom", message: "Phone is invalid" });
      return z.NEVER;
    }

    return `+1 (${subscriber.slice(0, 3)}) ${subscriber.slice(3, 6)}-${subscriber.slice(6)}`;
  })
  .openapi({
    description: "US phone number",
    example: "+1 (123) 456-7890",
    type: "string",
  });

export const UsPostalCode = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, { message: "Postal code is invalid" })
  .openapi({
    description: "US ZIP code",
    example: "94107",
    type: "string",
  });

const uspsStates = [
  "AK",
  "AL",
  "AR",
  "AS",
  "AZ",
  "CA",
  "CO",
  "CT",
  "DC",
  "DE",
  "FL",
  "GA",
  "GU",
  "HI",
  "IA",
  "ID",
  "IL",
  "IN",
  "KS",
  "KY",
  "LA",
  "MA",
  "MD",
  "ME",
  "MI",
  "MN",
  "MO",
  "MP",
  "MS",
  "MT",
  "NC",
  "ND",
  "NE",
  "NH",
  "NJ",
  "NM",
  "NV",
  "NY",
  "OH",
  "OK",
  "OR",
  "PA",
  "PR",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VA",
  "VI",
  "VT",
  "WA",
  "WI",
  "WV",
  "WY",
] as const;

export const UsState = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(uspsStates, { message: "State is invalid" }))
  .openapi({
    description: "USPS state code",
    example: "CA",
    type: "string",
  });

export { z };
