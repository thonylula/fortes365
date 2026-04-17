"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DISMISSED_KEY = "forte_push_dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      setShow(false);
    } catch {
      setShow(false);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="animate-in fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-xl border border-[color:var(--or)]/30 bg-[color:var(--s1)] p-4 shadow-xl shadow-black/40">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <div className="mb-1 font-[family-name:var(--font-condensed)] text-xs font-bold uppercase tracking-wider">
            Lembretes de treino
          </div>
          <p className="text-[11px] leading-relaxed text-[color:var(--tx2)]">
            Receba lembretes para nao perder seu streak e notificacoes de conquistas.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="rounded-md bg-[color:var(--or)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733] disabled:opacity-50"
            >
              {subscribing ? "Ativando..." : "Ativar"}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-md border border-[color:var(--bd)] px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--tx3)] transition-colors hover:border-[color:var(--tx3)]"
            >
              Agora nao
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
