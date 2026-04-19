import { angle, L, visible, type Detector } from "./types";

export const pushUp: Detector = (frame, prev) => {
  const lm = frame.landmarks;
  if (lm.length < 33) return { ...prev, cue: "pose nao detectada" };

  const shoulder = lm[L.R_SHOULDER];
  const elbow = lm[L.R_ELBOW];
  const wrist = lm[L.R_WRIST];
  const hip = lm[L.R_HIP];
  const ankle = lm[L.R_ANKLE];

  if (!visible([shoulder, elbow, wrist])) {
    return { ...prev, cue: "enquadre bracos na camera" };
  }

  const elbowAngle = angle(shoulder, elbow, wrist);
  const bodyAngle = visible([shoulder, hip, ankle])
    ? angle(shoulder, hip, ankle)
    : 180;

  let nextPhase = prev.phase;
  let reps = prev.reps;
  let cue: string | null = null;

  if (elbowAngle < 90) nextPhase = "down";
  else if (elbowAngle > 150) {
    if (prev.phase === "down") reps = prev.reps + 1;
    nextPhase = "up";
  }

  if (nextPhase === "down" && elbowAngle > 110) cue = "mais fundo";
  else if (bodyAngle < 160) cue = "quadril caiu";

  return { phase: nextPhase, reps, cue };
};
