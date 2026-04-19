// Sistema de 12 niveis (substitui a camada visual "Mes 1...Mes 12").
// Modelo de dados no banco continua como current_month int 0-11.
// Esta e so a camada de exibicao — aparece no strip de navegacao,
// landing, emails, etc.

export type LevelPhase = 0 | 1 | 2 | 3;

export type Level = {
  /** Numero sequencial 1-12 */
  n: number;
  /** Romano curto pra strip de navegacao (max 4 chars) */
  short: string;
  /** Nome completo do nivel (uppercase pra exibir em header) */
  name: string;
  /** Subtitulo tematico (1 frase) */
  subtitle: string;
  /** Fase 0-3 (Adaptacao, Forca, Potencia, Dominio) */
  phase: LevelPhase;
};

export const LEVELS: readonly Level[] = [
  { n: 1,  short: "I",    name: "DESPERTAR", subtitle: "O corpo se lembra.",              phase: 0 },
  { n: 2,  short: "II",   name: "IGNIÇÃO",   subtitle: "Chama acesa.",                    phase: 0 },
  { n: 3,  short: "III",  name: "ALICERCE",  subtitle: "Fundação posta.",                 phase: 0 },
  { n: 4,  short: "IV",   name: "TRAÇÃO",    subtitle: "Puxar e empurrar com propósito.", phase: 1 },
  { n: 5,  short: "V",    name: "FUNDAÇÃO",  subtitle: "Estrutura sólida.",               phase: 1 },
  { n: 6,  short: "VI",   name: "IMPULSO",   subtitle: "Primeiro salto adiante.",         phase: 1 },
  { n: 7,  short: "VII",  name: "EXPLOSÃO",  subtitle: "Força vira velocidade.",          phase: 2 },
  { n: 8,  short: "VIII", name: "FLUXO",     subtitle: "Movimento contínuo.",             phase: 2 },
  { n: 9,  short: "IX",   name: "POTÊNCIA",  subtitle: "No pico da curva.",               phase: 2 },
  { n: 10, short: "X",    name: "CONTROLE",  subtitle: "Gravidade é opcional.",           phase: 3 },
  { n: 11, short: "XI",   name: "MAESTRIA",  subtitle: "Execução impecável.",             phase: 3 },
  { n: 12, short: "XII",  name: "ÁPICE",     subtitle: "O topo.",                         phase: 3 },
] as const;

/** Recebe indice 0-11 (como vem do banco) e retorna o Level. Fallback no primeiro. */
export function levelByIndex(index: number): Level {
  return LEVELS[Math.max(0, Math.min(11, index))];
}

/** Nome curto pra strip ("I", "II", ...). */
export function levelShort(index: number): string {
  return levelByIndex(index).short;
}

/** Nome completo ("DESPERTAR", ...). */
export function levelName(index: number): string {
  return levelByIndex(index).name;
}
