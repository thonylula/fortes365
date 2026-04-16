"use client";

import { useCallback, useState } from "react";
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

export function QuizFlow({ initialData }: { initialData?: Answers }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialData ?? {});
  const [saving, setSaving] = useState(false);

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

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleAutoAdvance = (val: unknown) => {
    setAnswer(val);
    setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 300);
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    await saveOnboarding(answers);
  }, [answers, saving]);

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      {!isLoading && <ProgressBar currentStep={step} />}

      <div className="flex flex-1 flex-col">
        {/* Back button */}
        {step > 0 && !isLoading && (
          <button
            onClick={back}
            className="self-start px-4 py-2 font-[family-name:var(--font-condensed)] text-xs font-bold uppercase tracking-wider text-[color:var(--tx3)] transition-colors hover:text-[color:var(--tx)]"
          >
            ← Voltar
          </button>
        )}

        {/* Section label */}
        {!isLoading && current.sectionLabel && (
          <div className="px-4 text-center font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--tx3)]">
            {current.sectionLabel}
          </div>
        )}

        {/* Question */}
        <div className="flex flex-1 flex-col px-4 py-4">
          {current.question && !isLoading && (
            <div className="mb-2 text-center">
              <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-wider">
                {current.question}
              </h1>
              {current.subtitle && (
                <p className="mt-1 text-xs text-[color:var(--tx3)]">{current.subtitle}</p>
              )}
            </div>
          )}

          {/* Step content */}
          <div className="mx-auto w-full max-w-lg flex-1 py-4">
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
              className="w-full rounded-xl py-4 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[2px] text-black transition-all disabled:opacity-40"
              style={{ background: canProceed ? "var(--or)" : "var(--s2)" }}
            >
              {isSummary ? "Criar meu plano" : "Continuar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
