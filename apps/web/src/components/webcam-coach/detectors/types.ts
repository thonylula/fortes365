export type Landmark = { x: number; y: number; z: number; visibility: number };
export type PoseFrame = { landmarks: Landmark[]; timestamp: number };

export type DetectorState = {
  phase: "up" | "down" | "unknown";
  reps: number;
  cue: string | null;
};

export type Detector = (frame: PoseFrame, prev: DetectorState) => DetectorState;

export const INITIAL_STATE: DetectorState = {
  phase: "unknown",
  reps: 0,
  cue: null,
};

// MediaPipe Pose landmark indices (subset we care about)
export const L = {
  NOSE: 0,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
} as const;

export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function visible(pts: Landmark[], minVisibility = 0.5): boolean {
  return pts.every((p) => p.visibility >= minVisibility);
}
