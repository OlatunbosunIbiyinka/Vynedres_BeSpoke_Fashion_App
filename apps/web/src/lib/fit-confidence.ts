export function confidenceTextClass(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function confidenceBgClass(score: number): string {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  return "bg-red-500/15 text-red-600 border-red-500/30";
}
