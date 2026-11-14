"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconPause, IconPlay } from "./Icons";

type State = "idle" | "playing" | "paused" | "unsupported";

/**
 * Dual TTS: Web Speech primary; MP3 (audio_url) fallback; hide if neither.
 * Speak summary blocks only — not full original text.
 */
export function ListenButton({
  text,
  audioUrl,
}: {
  text: string;
  audioUrl: string | null;
}) {
  const [state, setState] = useState<State>("idle");
  const [hasViVoice, setHasViVoice] = useState<boolean | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const detect = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      setHasViVoice(voices.some((v) => v.lang?.toLowerCase().startsWith("vi")));
    };

    detect();
    window.speechSynthesis.addEventListener("voiceschanged", detect);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", detect);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (hasViVoice === false && audioUrl) {
      const el = new Audio(audioUrl);
      audioRef.current = el;
      el.onended = () => setState("idle");
      return () => {
        el.pause();
        el.src = "";
        audioRef.current = null;
      };
    }
    return undefined;
  }, [hasViVoice, audioUrl]);

  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    utterRef.current = null;
  }, []);

  const speak = useCallback(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    u.rate = 0.95;
    utterRef.current = u;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setState("playing");
  }, [text]);

  function toggle() {
    if (state === "unsupported") return;

    // Web Speech path
    if (hasViVoice) {
      if (state === "playing") {
        window.speechSynthesis.pause();
        setState("paused");
        return;
      }
      if (state === "paused") {
        window.speechSynthesis.resume();
        setState("playing");
        return;
      }
      speak();
      return;
    }

    // MP3 fallback
    const el = audioRef.current;
    if (el) {
      if (state === "playing") {
        el.pause();
        setState("paused");
        return;
      }
      if (state === "paused") {
        void el.play();
        setState("playing");
        return;
      }
      el.currentTime = 0;
      void el.play().then(() => setState("playing")).catch(() => setState("idle"));
      return;
    }

    // neither
    setState("unsupported");
  }

  function restart() {
    stopAll();
    if (hasViVoice) {
      speak();
      return;
    }
    const el = audioRef.current;
    if (el) {
      el.currentTime = 0;
      void el.play().then(() => setState("playing")).catch(() => setState("idle"));
    }
  }

  // First paint: show button optimistically if we don't know yet; hide only when confirmed no path.
  if (hasViVoice === false && !audioUrl) return null;
  if (hasViVoice === null && !audioUrl && typeof window !== "undefined" && !("speechSynthesis" in window)) {
    return null;
  }

  const label =
    state === "playing" ? "Dừng" : state === "paused" ? "Tiếp tục" : "Nghe thông báo";
  const Icon = state === "playing" ? IconPause : IconPlay;

  return (
    <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" className="btn btn--primary" onClick={toggle} aria-label={label}>
        <Icon width={18} height={18} />
        {label}
      </button>
      {(state === "playing" || state === "paused") && (
        <button type="button" className="btn btn--ghost" onClick={restart} aria-label="Nghe lại">
          Nghe lại
        </button>
      )}
      {state === "unsupported" && (
        <span style={{ fontSize: "var(--meta-size)", color: "var(--muted)" }}>
          Thiết bị chưa hỗ trợ đọc văn bản
        </span>
      )}
    </span>
  );
}
