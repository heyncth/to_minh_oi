"use client";

import { useEffect, useRef, useState } from "react";
import { RAG_CHIPS, SCAM_SAMPLES } from "@/lib/chat-samples";
import { IconLevelDot, IconMic } from "./Icons";

type Role = "user" | "assistant";
type HistoryItem = { role: Role; content: string };

type ScamPayload = {
  type: "scam";
  level: "safe" | "caution" | "danger";
  reasons: string[];
  advice: string;
};

type RagPayload = {
  type: "rag";
  answer: string;
  sources?: { procedure_name: string; similarity: number }[];
  guardrail?: boolean;
};

type Reply = ScamPayload | RagPayload;

type Turn = {
  id: string;
  role: Role;
  /** plain text for user + history */
  text: string;
  /** full reply payload for assistant turns */
  reply?: Reply;
  error?: string;
  retry?: boolean;
};

const STORE_KEY = "tro-ly-history";
const MAX_HISTORY = 10;

const SCAM_META: Record<
  ScamPayload["level"],
  { header: string; color: string; bg: string }
> = {
  danger: {
    header: "NGUY HIỂM – DẤU HIỆU LỪA ĐẢO CAO",
    color: "#ffffff",
    bg: "var(--negative)",
  },
  caution: {
    header: "Cần cảnh giác / Xác minh thêm",
    color: "#ffffff",
    bg: "var(--warning)",
  },
  safe: {
    header: "An toàn / Thông tin thông thường",
    color: "#ffffff",
    bg: "var(--positive)",
  },
};

function loadStored(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Turn[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && (t.role === "user" || t.role === "assistant")).slice(-MAX_HISTORY * 2);
  } catch {
    return [];
  }
}

function saveStored(turns: Turn[]) {
  try {
    const slim = turns
      .filter((t) => !t.error)
      .slice(-(MAX_HISTORY * 2))
      .map((t) => ({
        id: t.id,
        role: t.role,
        text: t.text,
        reply: t.reply,
      }));
    sessionStorage.setItem(STORE_KEY, JSON.stringify(slim));
  } catch {
    /* quota — ignore */
  }
}

function toHistory(turns: Turn[]): HistoryItem[] {
  return turns
    .filter((t) => !t.error && t.text)
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.text.slice(0, 2000) }));
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sourceLine(sources: RagPayload["sources"]): string | null {
  if (!sources || sources.length === 0) return null;
  const top = sources[0];
  const pct = Math.round(top.similarity * 100);
  return `Nguồn: ${top.procedure_name} · độ tương đồng ${pct}%`;
}

export function ChatPanel() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    // defer post-mount work so SSR markup matches first client paint
    const t = window.setTimeout(() => {
      setTurns(loadStored());
      setHydrated(true);
      const W = window as unknown as {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      };
      setMicSupported(Boolean(W.SpeechRecognition || W.webkitSpeechRecognition));
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hydrated) saveStored(turns);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, hydrated]);

  async function send(raw: string, opts?: { retryOf?: string }) {
    const message = raw.trim();
    if (!message || busy) return;

    const userId = opts?.retryOf ?? newId();
    const userTurn: Turn = { id: userId, role: "user", text: message };
    const base = turns.filter((t) => t.id !== userId);
    const history = toHistory(base.filter((t) => !t.error));
    setTurns([...base, userTurn]);
    setInput("");
    setBusy(true);
    setMicError(null);

    function fail(msg: string) {
      setTurns((cur) => {
        const withoutDup = cur.filter((t) => !(t.role === "assistant" && t.error));
        const hasUser = withoutDup.some((t) => t.id === userId);
        return [
          ...(hasUser ? withoutDup : [...withoutDup, userTurn]),
          { id: newId(), role: "assistant" as const, text: "", error: msg, retry: true },
        ];
      });
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const body = await res.json().catch(() => null);

      if (res.status === 429) {
        fail(
          body?.error?.message ?? "Hệ thống đang đông, cô/chú thử lại sau ít phút ạ.",
        );
        return;
      }

      if (!res.ok || !body || body.error) {
        fail(
          body?.error?.message ??
            "Trợ lý đang gặp sự cố. Cô/chú thử lại sau ít phút ạ.",
        );
        return;
      }

      const reply = body as Reply;
      const assistantText =
        reply.type === "rag" ? reply.answer : reply.reasons.join(" ");
      setTurns((cur) => {
        const withoutDup = cur.filter((t) => !(t.role === "assistant" && t.error));
        const hasUser = withoutDup.some((t) => t.id === userId);
        return [
          ...(hasUser ? withoutDup : [...withoutDup, userTurn]),
          { id: newId(), role: "assistant" as const, text: assistantText, reply },
        ];
      });
    } catch {
      fail("Không kết nối được. Cô/chú kiểm tra mạng rồi thử lại ạ.");
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setTurns([]);
    setInput("");
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  }

  function toggleMic() {
    type SpeechRecognitionInstance = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;
    const W = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      setMicError("Trình duyệt này chưa hỗ trợ gõ bằng giọng nói.");
      return;
    }
    if (recRef.current) {
      recRef.current.stop();
      recRef.current = null;
      return;
    }
    const rec = new Ctor();
    rec.lang = "vi-VN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onerror = () => setMicError("Không nghe rõ. Cô/chú thử lại hoặc gõ chữ ạ.");
    rec.onend = () => {
      recRef.current = null;
    };
    rec.start();
    recRef.current = rec;
  }

  const showEmpty = hydrated && turns.length === 0;

  return (
    <div className="chat">
      {showEmpty && (
        <p className="chat-empty__slogan">
          Cần hỏi thủ tục hay kiểm tra tin nhắn lạ, cứ nhắn Tổ Mình Ơi!
        </p>
      )}

      {hydrated && turns.length > 0 && (
        <div className="chat__header">
          <button type="button" className="chat__clear" onClick={clearChat}>
            Xóa hội thoại
          </button>
        </div>
      )}

      {showEmpty && (
        <>
          <p className="section-label">Gửi câu hỏi</p>
          <div className="chip-row">
            {RAG_CHIPS.map((c) => (
              <button key={c} type="button" className="chip" disabled={busy} onClick={() => void send(c)}>
                {c}
              </button>
            ))}
          </div>

          <p className="section-label">Thử mẫu lừa đảo</p>
          <div className="chip-row">
            {SCAM_SAMPLES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="chip"
                disabled={busy}
                onClick={() => void send(s.body)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {hydrated && turns.length > 0 && (
        <div className="chat__log" aria-live="polite">
          {turns.map((t) => (
            <div key={t.id} className={`chat__row chat__row--${t.role}`}>
              {t.role === "user" ? (
                <div className="bubble bubble--user">{t.text}</div>
              ) : t.error ? (
                <div className="bubble bubble--assistant bubble--error" role="alert">
                  <p>{t.error}</p>
                  {t.retry && (
                    <button
                      type="button"
                      className="btn btn--ghost chat__retry"
                      disabled={busy}
                      onClick={() => {
                        const idx = turns.findIndex((x) => x.id === t.id);
                        const prevUser = [...turns.slice(0, idx)]
                          .reverse()
                          .find((x) => x.role === "user");
                        if (prevUser) void send(prevUser.text, { retryOf: prevUser.id });
                      }}
                    >
                      Thử lại
                    </button>
                  )}
                </div>
              ) : (
                <AssistantBody turn={t} />
              )}
            </div>
          ))}
          {busy && (
            <div className="chat__row chat__row--assistant">
              <div className="bubble bubble--assistant chat__thinking" aria-busy="true">
                Tổ Mình Ơi đang soạn…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {micError && (
        <p className="chat__mic-error" role="status">
          {micError}
        </p>
      )}

      <form
        className="chat__composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        {micSupported && (
          <button
            type="button"
            className="chat__mic"
            aria-label="Nhập bằng giọng nói"
            onClick={toggleMic}
          >
            <IconMic width={22} height={22} />
          </button>
        )}
        <input
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi hoặc dán tin nhắn…"
          maxLength={2000}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="btn btn--primary chat__send" disabled={busy || !input.trim()}>
          Gửi
        </button>
      </form>
    </div>
  );
}

function AssistantBody({ turn }: { turn: Turn }) {
  const reply = turn.reply;
  if (!reply) return <div className="bubble bubble--assistant">{turn.text}</div>;

  if (reply.type === "scam") {
    const meta = SCAM_META[reply.level];
    return (
      <div className="bubble bubble--assistant bubble--scam">
        <div className="scam-card__header" style={{ background: meta.bg, color: meta.color }}>
          <IconLevelDot
            width={14}
            height={14}
            style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}
          />
          {meta.header}
        </div>
        <ul className="scam-card__reasons">
          {reply.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="scam-card__advice">
          <strong>Bạn nên:</strong> {reply.advice}
        </p>
      </div>
    );
  }

  const src = sourceLine(reply.sources);
  return (
    <div className="bubble bubble--assistant">
      <p className="bubble__text">{reply.answer}</p>
      {src && !reply.guardrail && <p className="bubble__source">{src}</p>}
    </div>
  );
}
