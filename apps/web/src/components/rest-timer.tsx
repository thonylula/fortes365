"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TIMER_KEY = "forte_rest_timer";

type TimerState = {
  endAt: number;
  duration: number;
  exercise: string;
};

function parseRestSeconds(rest: string): number {
  const match = rest.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 60;
}

function saveTimer(state: TimerState | null) {
  if (state) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
}

function loadTimer(): TimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as TimerState;
    if (state.endAt <= Date.now()) return null;
    return state;
  } catch {
    return null;
  }
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    }, 200);
  } catch {
    // AudioContext not available
  }
}

function vibrate() {
  try {
    navigator.vibrate?.([100, 50, 100]);
  } catch {
    // Vibration not available
  }
}

export function useRestTimer() {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const saved = loadTimer();
    if (saved) {
      setTimer(saved);
      firedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!timer) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        playBeep();
        vibrate();
        setTimeout(() => {
          setTimer(null);
          saveTimer(null);
        }, 2000);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer]);

  const start = useCallback((rest: string, exerciseName: string) => {
    const seconds = parseRestSeconds(rest);
    if (seconds <= 0) return;
    const state: TimerState = {
      endAt: Date.now() + seconds * 1000,
      duration: seconds,
      exercise: exerciseName,
    };
    firedRef.current = false;
    setTimer(state);
    saveTimer(state);
  }, []);

  const cancel = useCallback(() => {
    setTimer(null);
    saveTimer(null);
    setRemaining(0);
  }, []);

  return {
    isActive: timer !== null && remaining > 0,
    isFinished: timer !== null && remaining <= 0,
    remaining,
    duration: timer?.duration ?? 0,
    exercise: timer?.exercise ?? "",
    start,
    cancel,
  };
}

export function RestTimerOverlay({
  isActive,
  isFinished,
  remaining,
  duration,
  exercise,
  onCancel,
}: {
  isActive: boolean;
  isFinished: boolean;
  remaining: number;
  duration: number;
  exercise: string;
  onCancel: () => void;
}) {
  if (!isActive && !isFinished) return null;

  const progress = duration > 0 ? 1 - remaining / duration : 1;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - progress);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 animate-in">
      <div
        className="flex items-center gap-4 rounded-2xl border border-[color:var(--bd)] bg-[color:var(--s1)] px-5 py-3 shadow-xl shadow-black/40"
        style={{ minWidth: 260 }}
      >
        {/* Circular timer */}
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="var(--s2)"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={isFinished ? "var(--gn)" : "var(--or)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-200"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isFinished ? (
              <span className="text-lg text-[color:var(--gn)]">✓</span>
            ) : (
              <span className="font-[family-name:var(--font-display)] text-lg tracking-wider">
                {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : seconds}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
            {isFinished ? "Descanso concluido" : "Descansando"}
          </div>
          <div className="truncate text-sm font-semibold">{exercise}</div>
        </div>

        {/* Cancel */}
        {!isFinished && (
          <button
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--bd)] text-xs text-[color:var(--tx3)] transition-colors hover:border-[color:var(--or)] hover:text-[color:var(--or)]"
            aria-label="Cancelar timer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
