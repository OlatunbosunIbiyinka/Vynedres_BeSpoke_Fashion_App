import { z } from "zod";

/** Accepts ISO datetime or YYYY-MM-DD from date inputs */
export const optionalDateField = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  })
  .optional();

export const optionalMoneyField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}, z.number().nonnegative().optional());

export function parseDate(value: string): Date {
  return new Date(value);
}
