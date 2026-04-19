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
  hint: "Camera de lado, corpo inteiro visivel.",
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

// Slugs reais do banco (pt-BR). Mantido sincronizado com supabase/seed.sql.
export const SUPPORTED: Record<string, SupportedMovement> = {
  // flexoes
  "flexao-na-parede": PUSH_UP,
  "flexao-de-joelhos": PUSH_UP,
  "flexao-inclinada-na-mesa": PUSH_UP,
  "flexao-normal-no-chao": PUSH_UP,
  "flexao-diamante": PUSH_UP,
  "flexao-archer": PUSH_UP,
  "flexao-explosiva": PUSH_UP,
  "flexao-explosiva-clap": PUSH_UP,
  "flexao-20s-40s": PUSH_UP,
  "pike-push-up": PUSH_UP,
  "pike-push-up-avancado": PUSH_UP,
  "pike-push-up-c-pes-elevados": PUSH_UP,

  // agachamentos e investidas
  "agachamento-com-cadeira": SQUAT,
  "agachamento-livre": SQUAT,
  "agachamento-com-pausa": SQUAT,
  "agachamento-sumo": SQUAT,
  "agachamento-c-salto": SQUAT,
  "agachamento-salto-20s-40s": SQUAT,
  "agachamento-bulgaro": SQUAT,
  "bulgaro-c-pausa": SQUAT,
  "jump-squat": SQUAT,
  "pistol-squat-assistido": SQUAT,
  "avanco-alternado": SQUAT,
  "jump-lunge-avanco-c-salto": SQUAT,

  // barra (quando aparecer no plano futuro)
  "pull-up": PULL_UP,
  "chin-up": PULL_UP,
};

export function isSupported(slug: string | null | undefined): boolean {
  return !!slug && slug in SUPPORTED;
}
