"use client";

import { FormEvent, useRef, useState } from "react";
import { vynedresClientApi, type AssistantResponse } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  meta?: Pick<AssistantResponse, "intent" | "engine">;
};

const SUGGESTIONS = [
  "What is the average order processing time?",
  "Which orders are likely to be delayed?",
  "How many orders are in progress?",
];

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-vynedres-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="text-vynedres-ink/65">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderAnswer(text: string) {
  return text.split("\n").map((line, i) =>
    line.trim() === "" ? (
      <div key={i} className="h-2" />
    ) : (
      <p key={i} className="text-sm leading-relaxed text-vynedres-ink/80">
        {renderInline(line)}
      </p>
    ),
  );
}

export function StudioAssistant({ tenantSlug }: { tenantSlug: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Ask me about this studio's orders. I answer from live database metrics — not guesses.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    setQuestion("");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await vynedresClientApi.askAssistant(tenantSlug, trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: result.answer,
          meta: { intent: result.intent, engine: result.engine },
        },
      ]);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant request failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-vynedres-ink/[0.08] bg-white shadow-[0_10px_40px_-24px_rgba(33,28,20,0.25)]">
      <div className="rule-gold" />
      <div className="flex items-center gap-3.5 px-5 py-4">
        <Monogram />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-vynedres-golddeep">
            Studio Assistant
          </p>
          <h2 className="font-display text-xl font-light leading-tight text-vynedres-ink">
            How may I help with your orders?
          </h2>
        </div>
        <span className="ml-auto hidden items-center gap-2 text-[11px] font-light tracking-wide text-vynedres-ink/45 sm:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Answering from live data
        </span>
      </div>

      <div className="border-t border-vynedres-ink/[0.06] px-5 pb-5 pt-4">
        <div
          ref={listRef}
          className="mb-3 max-h-60 space-y-4 overflow-y-auto pr-1"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-vynedres-gold/15 px-4 py-2.5"
                    : "max-w-[92%] border-l border-vynedres-gold/50 pl-4"
                }
              >
                {msg.role === "assistant" ? (
                  <div className="space-y-0.5">{renderAnswer(msg.text)}</div>
                ) : (
                  <p className="text-sm text-vynedres-ink/85">{msg.text}</p>
                )}
                {msg.meta && (
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-vynedres-ink/40">
                    <span>{msg.meta.intent}</span>
                    <span className="text-vynedres-ink/25">·</span>
                    <span>{msg.meta.engine}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1 border-l border-vynedres-gold/50 py-1 pl-4">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-vynedres-golddeep/70 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-vynedres-golddeep/70 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-vynedres-golddeep/70" />
              </div>
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => void ask(s)}
              className="rounded-full border border-vynedres-ink/15 px-3 py-1.5 text-xs text-vynedres-ink/75 transition hover:border-vynedres-gold/60 hover:bg-vynedres-gold/10 hover:text-vynedres-golddeep disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "Which orders are likely to be delayed?"'
            className="min-w-0 flex-1 rounded-xl border border-vynedres-ink/15 bg-white px-4 py-2.5 text-sm outline-none ring-vynedres-gold/40 placeholder:text-vynedres-ink/45 focus:border-vynedres-gold/40 focus:ring-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-xl bg-vynedres-gold px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-black transition hover:bg-vynedres-golddeep hover:text-white disabled:opacity-50"
          >
            Ask
          </button>
        </form>

        <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-vynedres-ink/40">
          question → intent → analytics → PostgreSQL → answer
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function Monogram() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-vynedres-gold/40 bg-gradient-to-br from-vynedres-gold/[0.1] to-transparent">
      <span className="font-display text-xl font-light leading-none text-vynedres-golddeep">
        V
      </span>
    </span>
  );
}
