"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "install-prompt-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  async function install() {
    await deferred?.prompt();
    await deferred?.userChoice;
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="install-prompt" role="dialog" aria-label="Cài đặt ứng dụng">
      <p className="install-prompt__title">Cài đặt Tổ Mình Ơi vào màn hình chính</p>
      <p style={{ fontSize: "var(--meta-size)", color: "var(--muted)" }}>
        Dùng nhanh như ứng dụng, không cần tải từ cửa hàng.
      </p>
      <div className="install-prompt__actions">
        <button type="button" className="btn btn--primary" onClick={install}>
          Cài đặt
        </button>
        <button type="button" className="btn btn--ghost" onClick={dismiss}>
          Để sau
        </button>
      </div>
    </div>
  );
}
