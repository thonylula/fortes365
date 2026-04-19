import { angle, L, visible, type Detector } from "./types";

export const pullUp: Detector = (frame, prev) => {
  const lm = frame.landmarks;
  if (lm.length < 33) return { ...prev, cue: "pose nao detectada" };

  const shoulder = lm[L.R_SHOULDER];
  const elbow = lm[L.R_ELBOW];
  const wrist = lm[L.R_WRIST];
  const nose = lm[L.NOSE];

  if (!visible([shoulder, elbow, wrist])) {
    return { ...prev, cue: "enquadre bracos na camera" };
  }

  const elbowAngle = angle(shoulder, elbow, wrist);
  const chinAboveWrist = visible([nose, wrist]) ? nose.y < wrist.y : false;

  let nextPhase = prev.phase;
  let reps = prev.reps;
  let cue: string | null = null;

  if (elbowAngle > 150) nextPhase = "down";
  else if (elbowAngle < 80 && chinAboveWrist) {
    if (prev.phase === "down") reps = prev.reps + 1;
    nextPhase = "up";
  }

  if (nextPhase === "up" && !chinAboveWrist) cue = "queixo acima da barra";
  else if (prev.phase === "down" && elbowAngle > 170) cue = "estenda completo";

  return { phase: nextPhase, reps, cue };
};
