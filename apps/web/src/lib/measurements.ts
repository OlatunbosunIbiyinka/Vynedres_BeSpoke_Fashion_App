/** Standard bespoke fields (cm) — matches seed data shape. */
export const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve", label: "Sleeve" },
  { key: "inseam", label: "Inseam" },
] as const;

export type MeasurementData = Record<string, number | string>;

export function formatMeasurementValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
