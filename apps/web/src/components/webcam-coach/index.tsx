"use client";

import { useEffect, useRef, useState } from "react";
import { getPoseLandmarker, closePoseLandmarker } from "./pose-detector";
import { SUPPORTED } from "./supported";
import { INITIAL_STATE, type DetectorState } from "./detectors/types";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "running" }
  | { kind: "error"; message: string };

export default function WebcamCoach({
  exerciseSlug,
  onStop,
}: {
  exerciseSlug: string;
  onStop: (reps: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef<DetectorState>(INITIAL_STATE);
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(-1);

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [reps, setReps] = useState(0);
  const [cue, setCue] = useState<string | null>(null);

  const movement = SUPPORTED[exerciseSlug];

  useEffect(() => {
    if (!movement) return;
    let cancelled = false;

    const start = async () => {
      setStatus({ kind: "loading" });
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const landmarker = await getPoseLandmarker();
        if (cancelled) return;
        setStatus({ kind: "running" });

        const loop = () => {
          if (cancelled || !videoRef.current) return;
          const v = videoRef.current;
          const ts = performance.now();
          if (v.currentTime !== lastTimestampRef.current && v.readyState >= 2) {
            lastTimestampRef.current = v.currentTime;
            const result = landmarker.detectForVideo(v, ts);
            const landmarks = result.landmarks[0];
            if (landmarks) {
              const next = movement.detector(
                { landmarks, timestamp: ts },
                stateRef.current,
              );
              stateRef.current = next;
              setReps(next.reps);
              setCue(next.cue);
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Permissao de camera negada."
            : err instanceof Error
              ? err.message
              : "Nao foi possivel iniciar a camera.";
        if (!cancelled) setStatus({ kind: "error", message });
      }
    };

    start();

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      closePoseLandmarker();
    };
  }, [movement]);

  if (!movement) {
    return (
      <div className="p-6 text-center text-xs text-[color:var(--tx3)]">
        Este exercicio ainda nao tem coach por webcam.
      </div>
    );
  }

  const handleStop = () => {
    onStop(reps);
  };

  return (
    <div className="flex flex-col gap-3 bg-black p-3">
      <div className="text-[10px] text-[color:var(--tx3)]">
        {movement.hint} · Video fica no seu dispositivo, nada e enviado.
      </div>

      <div className="relative overflow-hidden rounded-md border border-[color:var(--bd)] bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="block w-full scale-x-[-1] bg-black"
          style={{ aspectRatio: "4 / 3" }}
        />

        {status.kind === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-[color:var(--tx2)]">
            Carregando modelo...
          </div>
        )}

        {status.kind === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-xs text-[color:var(--tx2)]">
            {status.message}
          </div>
        )}

        {status.kind === "running" && (
          <>
            <div className="absolute top-2 left-2 rounded bg-black/60 px-2 py-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--or)]">
              {movement.label}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
              <div>
                <div className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-wider text-white">
                  {reps}
                </div>
                <div className="mt-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--tx3)]">
                  reps
                </div>
              </div>
              {cue && (
                <div className="max-w-[60%] rounded bg-[color:var(--or)]/90 px-2 py-1 text-right text-[11px] font-bold text-black">
                  {cue}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleStop}
        className="rounded-md bg-[color:var(--or)] py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7733]"
      >
        Parar · {reps} reps
      </button>
    </div>
  );
}
