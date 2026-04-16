"use client";

import { useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Como fazer minha primeira flexão no chão?",
  "Tô com dor no ombro, o que faço?",
  "Qual a melhor comida antes do treino?",
  "Me dá uma dica pra agachamento pistol",
];

export function CoachChat({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json();
        setMessages([...newMessages, { role: "assistant", content: err.error ?? "Erro ao responder." }]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
              scrollToBottom();
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: isTimeout
            ? "O coach demorou demais para responder (servidor carregando). Tente novamente — a segunda tentativa costuma ser mais rápida."
            : "Erro de conexão. Tente novamente.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-3 text-5xl">🏋️</div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wider">
                COACH FORTE 365
              </h2>
              <p className="mt-2 text-sm text-[color:var(--tx2)]">
                Fala, {userName}! Sou seu coach virtual de calistenia.
                <br />
                Pergunte sobre exercícios, progressões, forma, nutrição ou dúvidas do treino.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s2)] px-3 py-2 text-left text-[12px] text-[color:var(--tx2)] transition-colors hover:border-[color:var(--or)] hover:text-[color:var(--tx)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] rounded-xl px-4 py-3 text-[13px] leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "var(--or)", color: "#000" }
                    : { background: "var(--s2)", color: "var(--tx)", border: "1px solid var(--bd)" }
                }
              >
                {msg.role === "assistant" && (
                  <div className="mb-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--or)]">
                    Coach
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {msg.content ? (
                    <RenderMarkdownLinks text={msg.content} />
                  ) : (
                    <span className="animate-pulse text-[color:var(--tx3)]">
                      Coach pensando...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-[color:var(--bd)] bg-[color:var(--s1)] px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao coach..."
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-[color:var(--bd)] bg-[color:var(--s2)] px-4 py-2.5 text-sm text-[color:var(--tx)] placeholder:text-[color:var(--tx3)] focus:border-[color:var(--or)] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 rounded-lg bg-[color:var(--or)] px-4 py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733] disabled:opacity-50"
          >
            {isStreaming ? "..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RenderMarkdownLinks({ text }: { text: string }) {
  const parts = text.split(/(\[.*?\]\(.*?\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (match) {
          return (
            <a
              key={i}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="yt-btn inline-flex !text-[11px]"
            >
              ▶ {match[1]}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
