import type { Detector } from "./detectors/types";
import { pushUp } from "./detectors/push-up";
import { squat } from "./detectors/squat";
import { pullUp } from "./detectors/pull-up";

export type SupportedMovement = {
  detector: Detector;
  label: string;
  hint: string;
};

const PUSH_UP: SupportedMovement = {
  detector: pushUp,
  label: "Flexao",
  hint: "Posicione a camera de lado, corpo inteiro visivel.",
};

const SQUAT: SupportedMovement = {
  detector: squat,
  label: "Agachamento",
  hint: "Camera de lado, do quadril pra baixo visivel.",
};

const PULL_UP: SupportedMovement = {
  detector: pullUp,
  label: "Barra",
  hint: "Camera frontal, barra e queixo visiveis.",
};

export const SUPPORTED: Record<string, SupportedMovement> = {
  "push-up": PUSH_UP,
  "push-up-incline": PUSH_UP,
  "push-up-knee": PUSH_UP,
  "diamond-push-up": PUSH_UP,
  "wide-push-up": PUSH_UP,
  "squat": SQUAT,
  "air-squat": SQUAT,
  "bodyweight-squat": SQUAT,
  "goblet-squat": SQUAT,
  "split-squat": SQUAT,
  "pull-up": PULL_UP,
  "chin-up": PULL_UP,
  "assisted-pull-up": PULL_UP,
  "negative-pull-up": PULL_UP,
};

export function isSupported(slug: string | null | undefined): boolean {
  return !!slug && slug in SUPPORTED;
}
