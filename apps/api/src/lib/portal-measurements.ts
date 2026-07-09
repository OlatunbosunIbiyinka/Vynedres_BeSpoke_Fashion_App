import { z } from "zod";

export const MEASUREMENT_FIELD_KEYS = [
  "chest",
  "waist",
  "hips",
  "shoulder",
  "sleeve",
  "inseam",
] as const;

export const portalSessionSchema = z.object({
  token: z.string().min(16).max(200),
});

export const portalMeasurementSchema = z.object({
  token: z.string().min(16).max(200),
  orderId: z.string().cuid().optional(),
  label: z.string().min(1).max(100).optional(),
  data: z.record(z.union([z.number(), z.string()])),
});

export function validateMeasurementData(
  data: Record<string, number | string>,
): { ok: true; data: Record<string, number | string> } | { ok: false; error: string } {
  const normalized: Record<string, number | string> = { unit: "cm" };
  let count = 0;

  for (const key of MEASUREMENT_FIELD_KEYS) {
    const raw = data[key];
    if (raw === undefined || raw === null || raw === "") continue;

    const num = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(num) || num <= 0) {
      return { ok: false, error: `${key} must be a positive number` };
    }
    normalized[key] = num;
    count++;
  }

  if (count === 0) {
    return { ok: false, error: "Enter at least one measurement" };
  }

  return { ok: true, data: normalized };
}
