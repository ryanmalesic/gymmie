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

export { z };
