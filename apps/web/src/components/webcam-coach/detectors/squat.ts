import { angle, L, visible, type Detector } from "./types";

export const squat: Detector = (frame, prev) => {
  const lm = frame.landmarks;
  if (lm.length < 33) return { ...prev, cue: "pose nao detectada" };

  const hip = lm[L.R_HIP];
  const knee = lm[L.R_KNEE];
  const ankle = lm[L.R_ANKLE];
  const shoulder = lm[L.R_SHOULDER];

  if (!visible([hip, knee, ankle])) {
    return { ...prev, cue: "enquadre pernas na camera" };
  }

  const kneeAngle = angle(hip, knee, ankle);
  const torsoAngle = visible([shoulder, hip, knee])
    ? angle(shoulder, hip, knee)
    : 180;

  let nextPhase = prev.phase;
  let reps = prev.reps;
  let cue: string | null = null;

  if (kneeAngle < 100) nextPhase = "down";
  else if (kneeAngle > 160) {
    if (prev.phase === "down") reps = prev.reps + 1;
    nextPhase = "up";
  }

  if (nextPhase === "down" && kneeAngle > 120) cue = "agache mais fundo";
  else if (torsoAngle < 60) cue = "tronco muito inclinado";

  return { phase: nextPhase, reps, cue };
};
