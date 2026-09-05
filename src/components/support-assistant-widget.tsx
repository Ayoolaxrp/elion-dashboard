"use client";

// Floating support assistant: a discreet chat bubble on the support page.
// Mobile-first: full-width sheet on small screens, 44px+ tap targets, no
// layout jumps. If the assistant cannot answer, it hands off honestly to
// the support form with the chat context prefilled.

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, ArrowRight } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can answer questions about ELION: the free audit, automation systems, pricing, and how payment works. What would you like to know?",
};

export default function SupportAssistantWidget({
  onHandoff,
}: {
  onHandoff?: (contextMessage: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastWasFallback, setLastWasFallback] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the newest message when the transcript grows.
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  // Focus the input on open for desktop only; mobile keyboards are triggered
  // by the user tapping the field, which is more predictable.
  useEffect(() => {
    if (open && window.matchMedia("(min-width: 640px)").matches) {
      inputRef.current?.focus();
    }
  }, [open]);

  async function send(questionText: string) {
    const question = questionText.trim();
    if (!question || busy) return;
    const history = messages.filter((m) => m !== GREETING).slice(-8);

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });
      const data = await res.json().catch(() => null);
      const reply =
        data && data.success && typeof data.reply === "string"
          ? data.reply
          : "Something went wrong. Please use the support form below; the team replies within 24 hours.";
      setLastWasFallback(Boolean(data?.fallback));
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setLastWasFallback(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the assistant just now. Please use the support form below; the team replies within 24 hours.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // Handoff: pass the conversation gist to the support form so the visitor
  // does not have to repeat themselves.
  function handoffToForm() {
    const context = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .slice(-3)
      .join(" | ");
    setOpen(false);
    onHandoff?.(context ? `Support chat follow-up: ${context}` : "");
  }

  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div
          role="dialog"
          aria-label="ELION support assistant"
          className="mb-3 flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-xl fixed inset-x-3 bottom-20 top-20 sm:static sm:inset-auto sm:w-[360px] sm:h-[480px] sm:max-h-[70vh]"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">ELION Assistant</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">Answers about the audit, systems and pricing</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm leading-relaxed text-white"
                      : "max-w-[85%] rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)]"
                  }
                >
                  {m.content}
                </p>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <p className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)]">Typing…</p>
              </div>
            )}
          </div>

          {hasUserMessages && (
            <div className="border-t border-[var(--color-border)] px-4 pt-2">
              <button
                type="button"
                onClick={handoffToForm}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              >
                Continue in the support form
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              {lastWasFallback && (
                <p className="mt-1 text-center text-[10px] text-[var(--color-text-muted)]">
                  The assistant could not answer that one. The form reaches a human within 24 hours.
                </p>
              )}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-[var(--color-border)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Your question"
              maxLength={1000}
              className="min-h-[44px] flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length === 0}
              aria-label="Send question"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close support assistant" : "Open support assistant"}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
