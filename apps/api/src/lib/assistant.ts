/**
 * Studio assistant = data consumption + light AI routing.
 *
 * Pattern (same as production AI systems):
 *   1. User asks in natural language
 *   2. Router picks a tool (intent)
 *   3. Tool runs analytics on real DB data (no hallucinated numbers)
 *   4. Answer is written from tool results
 *
 * Optional OPENAI_API_KEY improves free-form phrasing; metrics always come
 * from analytics tools either way.
 */

import {
  getAverageProcessingTime,
  getOrdersLikelyDelayed,
  getPipelineSummary,
  type DelayRiskOrder,
  type DelayRiskResult,
  type PipelineSummary,
  type ProcessingTimeResult,
} from "./analytics.js";
import { getOrdersWithFitRisk, type FitRiskOrder } from "./fit-graph.js";

export type AssistantIntent =
  | "avg_processing_time"
  | "delay_risk"
  | "pipeline_summary"
  | "fit_risk"
  | "help";

export type AssistantResponse = {
  answer: string;
  intent: AssistantIntent;
  /** Structured facts used to build the answer — study this for data engineering. */
  data: unknown;
  engine: "rules" | "openai+tools";
};

const HELP_TEXT = `I can answer questions about **this studio's** orders using live data:

• **Average processing time** — e.g. "What is the average order processing time?"
• **Delay risk** — e.g. "Which orders are likely to be delayed?"
• **Fit risk** — e.g. "Which orders have measurement anomalies or low fit confidence?"
• **Pipeline summary** — e.g. "How many orders are in progress?"

I only use numbers computed from your database (no invented stats).`;

function normalize(question: string): string {
  return question.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Rule-based intent router — works without any external AI API. */
export function routeIntent(question: string): AssistantIntent {
  const q = normalize(question);

  if (
    /help|what can you|how do you|capabilities|commands/.test(q)
  ) {
    return "help";
  }

  // Broad match so typos like "avaerage" still work when "process" + "time" appear.
  if (
    /process(ing)?\s*time|turnaround|how long.*(order|take|process|complete)|order.*(average|avg|mean|typical)|aver\w*.*(order|process|completion|day)/.test(
      q,
    )
  ) {
    return "avg_processing_time";
  }

  // Fit risk is checked BEFORE delay risk so phrases like "at risk of fit"
  // (which also contain the generic words "at risk") are not stolen by delay.
  // A garment/measurement word + a concern word, in any order, means fit risk.
  const mentionsFit =
    /\bfit(s|ting|tings|ted)?\b|garment|garments|clothe?s|clothing|outfit|measurement|tailor(ing|ed)?|silhouette|drape/.test(
      q,
    );
  const mentionsConcern =
    /risk|issue|problem|anomal|discrepan|confidence|bad(ly)?|poor(ly)?|wrong|off|concern|worst|attention|alter|remake|redo|flag|too (big|small|tight|loose)|won'?t fit|not? fit|doesn'?t fit/.test(
      q,
    );
  if (
    (mentionsFit && mentionsConcern) ||
    /fit(ting)?\s*(risk|issue|problem|anomal|confidence|graph|delta)|measurement.*(change|shift|anomal)|remake|low confidence|fitting round|poor(ly)? fit|bad fit|too (big|small|tight|loose)/.test(
      q,
    )
  ) {
    return "fit_risk";
  }

  if (
    /delay|overdue|at risk|behind schedule|running late|slipping|which order|orders?\s+(are|is)\s+likely|need attention|deadline|due date|on time|late/.test(
      q,
    )
  ) {
    return "delay_risk";
  }

  if (
    /pipeline|how many|summary|overview|status breakdown|in progress|active orders|order status/.test(
      q,
    )
  ) {
    return "pipeline_summary";
  }

  if (/order/.test(q) && /(slow|risk|problem|attention|late)/.test(q)) {
    return "delay_risk";
  }

  return "help";
}

function formatProcessingTime(result: ProcessingTimeResult): string {
  if (result.deliveredCount === 0) {
    return (
      "There are **no delivered orders** yet, so average processing time cannot be calculated. " +
      "Mark an order as **Delivered** (and keep status history) to start building this metric."
    );
  }

  const lines = [
    `**Average order processing time:** ${result.averageDays} day(s)`,
    `(based on **${result.deliveredCount}** delivered order${result.deliveredCount === 1 ? "" : "s"})`,
    "",
    `• Median: **${result.medianDays}** day(s)`,
    `• Fastest: **${result.minDays}** day(s)`,
    `• Slowest: **${result.maxDays}** day(s)`,
  ];

  if (result.samples.length > 0) {
    lines.push("", "**Recent completed samples:**");
    for (const s of result.samples.slice(0, 5)) {
      lines.push(`• ${s.orderNumber} (${s.clientName}) — ${s.days} day(s)`);
    }
  }

  lines.push(
    "",
    "_Processing time = order date → date marked Delivered (from status history)._",
  );

  return lines.join("\n");
}

function riskLabel(level: DelayRiskOrder["riskLevel"]): string {
  if (level === "overdue") return "OVERDUE";
  if (level === "at_risk") return "AT RISK";
  return "WATCH";
}

function formatDelayRisk(result: DelayRiskResult): string {
  if (result.atRiskCount === 0) {
    const avgNote =
      result.averageProcessingDays !== null
        ? ` Studio average completion is **${result.averageProcessingDays}** day(s).`
        : "";
    return (
      `No active orders currently look delayed or at risk.${avgNote} ` +
      "I check past completion/pickup dates, near deadlines, and age vs average processing time."
    );
  }

  const lines = [
    `**${result.atRiskCount}** order${result.atRiskCount === 1 ? "" : "s"} may be delayed or need attention:`,
    "",
  ];

  for (const order of result.orders) {
    lines.push(
      `• **${order.orderNumber}** — ${order.garmentType} for ${order.clientName}`,
      `  Status: ${order.status.replaceAll("_", " ")} · Age: ${order.ageDays} day(s) · **${riskLabel(order.riskLevel)}**`,
    );
    for (const reason of order.reasons) {
      lines.push(`  – ${reason}`);
    }
    lines.push("");
  }

  if (result.averageProcessingDays !== null) {
    lines.push(
      `_Compared against average processing time of ${result.averageProcessingDays} day(s)._`,
    );
  }

  return lines.join("\n").trim();
}

function formatPipeline(summary: PipelineSummary): string {
  if (summary.totalOrders === 0) {
    return "This studio has **no orders** yet. Create an order to populate the pipeline.";
  }

  const lines = [
    `**Pipeline summary** — **${summary.totalOrders}** total order${summary.totalOrders === 1 ? "" : "s"}`,
    "",
    `• Active: **${summary.activeCount}**`,
    `• Delivered: **${summary.deliveredCount}**`,
    `• Cancelled: **${summary.cancelledCount}**`,
    "",
    "**By status:**",
  ];

  for (const [status, count] of Object.entries(summary.byStatus)) {
    if (count === 0) continue;
    lines.push(`• ${status.replaceAll("_", " ")}: **${count}**`);
  }

  return lines.join("\n");
}

function formatFitRisk(result: {
  orders: FitRiskOrder[];
  lowConfidenceCount: number;
}): string {
  if (result.lowConfidenceCount === 0) {
    return (
      "No active orders show **measurement anomalies** or **low fit confidence** right now. " +
      "Record fitting rounds on orders to build the Fit Graph and enable delta alerts."
    );
  }

  const lines = [
    `**${result.lowConfidenceCount}** active order${result.lowConfidenceCount === 1 ? "" : "s"} flagged by the Fitting Delta Engine:`,
    "",
  ];

  for (const order of result.orders) {
    lines.push(
      `• **${order.orderNumber}** — ${order.garmentType} for ${order.clientName}`,
      `  Fit confidence: **${order.fitConfidence}%** · Alerts: **${order.alertCount}**`,
    );
    if (order.topAlert) {
      lines.push(`  – ${order.topAlert}`);
    }
    lines.push("");
  }

  lines.push(
    "_Fit confidence uses baseline → fitting round deltas and delivery outcomes (Fit Graph)._",
  );

  return lines.join("\n").trim();
}

async function runTool(
  tenantId: string,
  intent: AssistantIntent,
): Promise<{ answer: string; data: unknown }> {
  switch (intent) {
    case "avg_processing_time": {
      const data = await getAverageProcessingTime(tenantId);
      return { answer: formatProcessingTime(data), data };
    }
    case "delay_risk": {
      const data = await getOrdersLikelyDelayed(tenantId);
      return { answer: formatDelayRisk(data), data };
    }
    case "fit_risk": {
      const data = await getOrdersWithFitRisk(tenantId);
      return { answer: formatFitRisk(data), data };
    }
    case "pipeline_summary": {
      const data = await getPipelineSummary(tenantId);
      return { answer: formatPipeline(data), data };
    }
    case "help":
    default:
      return { answer: HELP_TEXT, data: { intents: ["avg_processing_time", "delay_risk", "fit_risk", "pipeline_summary"] } };
  }
}

type OpenAiToolName =
  | "avg_processing_time"
  | "delay_risk"
  | "fit_risk"
  | "pipeline_summary"
  | "help";

async function routeWithOpenAi(question: string): Promise<OpenAiToolName | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You route a bespoke-tailoring studio's analytics question to exactly ONE tool.\n" +
              "Tools:\n" +
              "- avg_processing_time: how long orders take to make / turnaround / completion time.\n" +
              "- delay_risk: orders overdue, late, behind schedule, near deadline, at risk of missing a due/pickup date (a SCHEDULE concern).\n" +
              "- fit_risk: garments/clothes at risk of fitting badly — measurement anomalies, low fit confidence, remakes, alterations, fitting deltas (a QUALITY-OF-FIT concern).\n" +
              "- pipeline_summary: counts or status breakdown of orders (how many, overview, by status).\n" +
              "- help: anything else.\n" +
              "Disambiguation: any mention of how a garment FITS — e.g. 'at risk of fit', 'fit risk', 'clothes fitting badly', 'too tight/loose', 'needs remake' — is fit_risk, NOT delay_risk. delay_risk is only about time/schedule.\n" +
              "Reply with ONLY the tool name, nothing else.",
          },
          { role: "user", content: question },
        ],
      }),
    });

    if (!res.ok) return null;

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";
    const allowed: OpenAiToolName[] = [
      "avg_processing_time",
      "delay_risk",
      "fit_risk",
      "pipeline_summary",
      "help",
    ];
    return allowed.find((t) => content.includes(t)) ?? null;
  } catch {
    return null;
  }
}

export async function askAssistant(
  tenantId: string,
  question: string,
): Promise<AssistantResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: "Ask a question about your orders — for example average processing time or delay risk.",
      intent: "help",
      data: null,
      engine: "rules",
    };
  }

  const openAiIntent = await routeWithOpenAi(trimmed);
  const intent = openAiIntent ?? routeIntent(trimmed);
  const engine = openAiIntent ? "openai+tools" : "rules";
  const { answer, data } = await runTool(tenantId, intent);

  return { answer, intent, data, engine };
}
