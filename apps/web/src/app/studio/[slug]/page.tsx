"use client";

import { use } from "react";
import { StudioDashboard } from "@/components/StudioDashboard";

export default function StudioDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <StudioDashboard slug={slug} />;
}
