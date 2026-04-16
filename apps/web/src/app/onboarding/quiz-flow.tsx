"use client";

import { useCallback, useState, useEffect } from "react";
import { STEPS } from "./steps";
import { saveOnboarding } from "./actions";
import { ProgressBar } from "./components/progress-bar";
import { SingleSelect } from "./components/single-select";
import { SingleCard } from "./components/single-card";
import { MultiSelect } from "./components/multi-select";
import { NumberInput } from "./components/number-input";
import { Interstitial } from "./components/interstitial";
import { Summary } from "./components/summary";
import { Loading } from "./components/loading";

type Answers = Record<string, unknown>;

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[color:var(--bg)]">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[600px] w-[600px] animate-spin rounded-full border border-[color:var(--or)]/5" style={{ animationDuration: "30s" }} />
        <div className="absolute h-[450px] w-[450px] animate-spin rounded-full border border-[color:var(--or)]/10" style={{ animationDuration: "20s", animationDirection: "reverse" }} />
        <div className="absolute h-[300px] w-[300px] animate-spin rounded-full border border-[color:var(--or)]/15" style={{ animationDuration: "15s" }} />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center px-6 text-center transition-all duration-1000"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
      >
        {/* Logo */}
        <div className="mb-6 font-[family-name:var(--font-display)] text-5xl tracking-[6px]">
          FORT<span style={{ color: "var(--or)" }}>E</span>
          <sub className="text-lg tracking-normal text-[color:var(--tx3)]">365</sub>
        </div>

        {/* Tagline */}
        <div className="mb-2 font-[family-name:var(--font-display)] text-2xl tracking-wider">
          SEU PLANO DE
        </div>
        <div className="mb-8 font-[family-name:var(--font-display)] text-3xl tracking-wider" style={{ color: "var(--or)" }}>
          CALISTENIA PERSONALIZADO
        </div>

        {/* Stats row */}
        <div className="mb-10 flex gap-6">
          <StatBubble value="12" label="meses" />
          <StatBubble value="365" label="dias" />
          <StatBubble value="4" label="fases" />
        </div>

        {/* Subtitle */}
        <p className="mb-10 max-w-sm text-sm leading-relaxed text-[color:var(--tx2)]">
          Responda algumas perguntas rápidas para personalizarmos seu plano de treino, nutrição e nível de dificuldade.
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="group relative w-full max-w-xs overflow-hidden rounded-2xl py-5 font-[family-name:var(--font-condensed)] text-base font-bold uppercase tracking-[3px] text-black"
          style={{ background: "var(--or)" }}
        >
          <span className="relative z-10">Começar — 1 minuto</span>
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <p className="mt-4 text-[10px] text-[color:var(--tx3)]">
          Sem equipamentos. Sem academia. Só você.
        </p>
      </div>
    </div>
  );
}

function StatBubble({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[color:var(--or)]/30 font-[family-name:var(--font-display)] text-2xl tracking-wider"
        style={{ background: "var(--ord)" }}
      >
        <span style={{ color: "var(--or)" }}>{value}</span>
      </div>
      <span className="mt-1.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
        {label}
      </span>
    </div>
  );
}

export function QuizFlow({ initialData }: { initialData?: Answers }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialData ?? {});
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [animating, setAnimating] = useState(false);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    await saveOnboarding(answers);
  }, [answers, saving]);

  if (!started) return <WelcomeScreen onStart={() => setStarted(true)} />;

  const current = STEPS[step];
  const isInterstitial = current.type === "interstitial";
  const isLoading = current.type === "loading";
  const isSummary = current.type === "summary";

  const answer = current.dbColumn ? answers[current.dbColumn] : answers[current.id];

  const canProceed = (() => {
    if (isInterstitial || isSummary || isLoading) return true;
    if (current.type === "multi-select") return Array.isArray(answer) && answer.length > 0;
    if (current.type === "number-input") {
      const num = answer as number | undefined;
      return num != null && num >= (current.min ?? 0) && num <= (current.max ?? 999);
    }
    return answer != null && answer !== "";
  })();

  const setAnswer = (val: unknown) => {
    const key = current.dbColumn ?? current.id;
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const goTo = (target: number, dir: "next" | "back") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 200);
  };

  const next = () => goTo(Math.min(step + 1, STEPS.length - 1), "next");
  const back = () => goTo(Math.max(step - 1, 0), "back");

  const handleAutoAdvance = (val: unknown) => {
    setAnswer(val);
    setTimeout(() => goTo(Math.min(step + 1, STEPS.length - 1), "next"), 250);
  };

  const slideStyle = {
    opacity: animating ? 0 : 1,
    transform: animating
      ? direction === "next" ? "translateX(40px)" : "translateX(-40px)"
      : "translateX(0)",
    transition: "all 0.2s ease-out",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      {!isLoading && <ProgressBar currentStep={step} />}

      <div className="flex flex-1 flex-col">
        {/* Top bar: back + section */}
        {!isLoading && (
          <div className="flex items-center justify-between px-4 py-2">
            {step > 0 ? (
              <button
                onClick={back}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--bd)] text-sm text-[color:var(--tx3)] transition-colors hover:border-[color:var(--or)] hover:text-[color:var(--or)]"
              >
                ←
              </button>
            ) : <div className="w-8" />}
            {current.sectionLabel && (
              <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
                {current.sectionLabel}
              </span>
            )}
            <span className="font-[family-name:var(--font-condensed)] text-[10px] tracking-wider text-[color:var(--tx3)]">
              {step + 1}/{STEPS.length}
            </span>
          </div>
        )}

        {/* Animated step content */}
        <div className="flex flex-1 flex-col px-4 py-2" style={slideStyle}>
          {current.question && !isLoading && (
            <div className="mb-4 text-center">
              <h1 className="font-[family-name:var(--font-display)] text-[22px] leading-tight tracking-wider sm:text-2xl">
                {current.question}
              </h1>
              {current.subtitle && (
                <p className="mt-2 text-xs text-[color:var(--tx3)]">{current.subtitle}</p>
              )}
            </div>
          )}

          <div className="mx-auto w-full max-w-lg flex-1 py-2">
            {current.type === "single-select" && (
              <SingleSelect step={current} value={answer as string} onSelect={handleAutoAdvance} />
            )}
            {current.type === "single-card" && (
              <SingleCard step={current} value={answer as string} onSelect={handleAutoAdvance} />
            )}
            {current.type === "multi-select" && (
              <MultiSelect
                step={current}
                value={(answer as string[]) ?? []}
                onSelect={(val) => setAnswer(val)}
              />
            )}
            {current.type === "number-input" && (
              <NumberInput
                step={current}
                value={answer as number | undefined}
                onSelect={(val) => setAnswer(val)}
                allAnswers={answers}
              />
            )}
            {current.type === "interstitial" && <Interstitial step={current} />}
            {current.type === "summary" && <Summary answers={answers} />}
            {current.type === "loading" && <Loading onComplete={handleSave} />}
          </div>
        </div>

        {/* Bottom button */}
        {!isLoading && (current.type === "multi-select" || current.type === "number-input" || isInterstitial || isSummary) && (
          <div className="px-4 pb-6 pt-2">
            <button
              onClick={next}
              disabled={!canProceed}
              className="group relative w-full overflow-hidden rounded-2xl py-4 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[2px] text-black transition-all disabled:opacity-40"
              style={{ background: canProceed ? "var(--or)" : "var(--s2)" }}
            >
              <span className="relative z-10">
                {isSummary ? "Criar meu plano" : isInterstitial ? "Continuar" : "Próximo passo"}
              </span>
              {canProceed && <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
