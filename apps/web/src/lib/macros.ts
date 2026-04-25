/**
 * Calculadora de necessidades nutricionais com base em literatura científica.
 *
 * Referências:
 * - Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new
 *   predictive equation for resting energy expenditure in healthy individuals.
 *   Am J Clin Nutr. 1990 Feb;51(2):241-7. doi: 10.1093/ajcn/51.2.241
 *   → fórmula de BMR usada (gold standard, ~10% de erro contra calorimetria).
 *
 * - Harris JA, Benedict FG. A Biometric Study of Human Basal Metabolism.
 *   PNAS. 1918;4(12):370-3.
 *   → multiplicadores de atividade (atualizados em literatura subsequente).
 *
 * - Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports
 *   Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr.
 *   2017;14:20. doi: 10.1186/s12970-017-0177-8
 *   → faixa 1.4-2.0g/kg para atletas; 1.6-2.2g/kg em déficit calórico.
 *
 * - American College of Sports Medicine. ACSM's Guidelines for Exercise
 *   Testing and Prescription, 11th ed. 2021.
 *   → déficit/superávit calórico recomendado (~500kcal/dia ≈ 0.5kg/sem).
 *
 * - Helms ER, et al. Evidence-based recommendations for natural bodybuilding
 *   contest preparation: nutrition and supplementation. J Int Soc Sports
 *   Nutr. 2014;11:20. → distribuição macros em corte.
 */

export type Sex = "M" | "F" | "O";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extreme";
export type Goal = "cutting" | "maintenance" | "bulking";

export type UserMetrics = {
  weight_kg: number;
  height_cm: number;
  birth_date: string; // ISO 8601 date
  sex: Sex;
  activity_level: ActivityLevel;
  goal: Goal;
};

export type Macros = {
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
};

/**
 * Multiplicadores de atividade aplicados sobre BMR pra obter TDEE.
 * Os valores são os clássicos da Harris-Benedict atualizada (Roza & Shizgal, 1984).
 */
export const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2, // pouco ou nenhum exercício
  light: 1.375, // 1-3x/semana, exercício leve
  moderate: 1.55, // 3-5x/semana, exercício moderado
  very: 1.725, // 6-7x/semana, exercício intenso
  extreme: 1.9, // 2x/dia, atletas ou trabalho físico pesado
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentário (sem exercício)",
  light: "Leve (1-3x/sem)",
  moderate: "Moderado (3-5x/sem)",
  very: "Intenso (6-7x/sem)",
  extreme: "Extremo (2x/dia)",
};

export const GOAL_LABEL: Record<Goal, string> = {
  cutting: "Cutting (perder gordura)",
  maintenance: "Manutenção",
  bulking: "Bulking (ganhar massa)",
};

export const SEX_LABEL: Record<Sex, string> = {
  M: "Masculino",
  F: "Feminino",
  O: "Outro / Prefiro não informar",
};

/**
 * Idade em anos completos a partir de uma data de nascimento ISO.
 */
export function calculateAge(birthDateIso: string): number {
  const birth = new Date(birthDateIso);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * BMR (Basal Metabolic Rate) pela equação de Mifflin-St Jeor (1990).
 *
 * Fórmula:
 *   BMR = 10·peso(kg) + 6.25·altura(cm) − 5·idade(anos) + s
 *   onde s = +5 (homem) ou −161 (mulher).
 *
 * Para sex='O' (outro), usamos s=+5 como padrão neutro; user pode override
 * preenchendo "M" ou "F" se preferir uma fórmula específica.
 */
export function calculateBMR(
  m: Pick<UserMetrics, "weight_kg" | "height_cm" | "birth_date" | "sex">,
): number {
  const age = calculateAge(m.birth_date);
  const offset = m.sex === "F" ? -161 : 5;
  return 10 * m.weight_kg + 6.25 * m.height_cm - 5 * age + offset;
}

/**
 * TDEE (Total Daily Energy Expenditure) = BMR × multiplicador de atividade.
 */
export function calculateTDEE(m: UserMetrics): number {
  return calculateBMR(m) * ACTIVITY_MULT[m.activity_level];
}

/**
 * Meta calórica diária ajustada pelo objetivo.
 * - cutting: −20% TDEE (déficit moderado, ~0.5–0.7kg/sem perda; sustentável)
 * - maintenance: 100% TDEE
 * - bulking: +10% TDEE (superávit conservador, ~0.2–0.3kg/sem ganho)
 *
 * Cuts mais agressivos (>25%) ou bulks mais largos (>20%) NÃO são oferecidos
 * por padrão — Helms (2014) e Aragon (2017) recomendam ritmos conservadores
 * pra preservar massa magra e minimizar ganho de gordura.
 */
export function calculateKcalTarget(m: UserMetrics): number {
  const tdee = calculateTDEE(m);
  if (m.goal === "cutting") return Math.round(tdee * 0.8);
  if (m.goal === "bulking") return Math.round(tdee * 1.1);
  return Math.round(tdee);
}

/**
 * Distribuição de macros baseada em ISSN Position Stand (2017) e ACSM.
 *
 * - **Proteína** (1g = 4 kcal):
 *     - cutting: 2.2g/kg (preserva massa magra em déficit, Helms 2014)
 *     - maintenance: 1.6g/kg (mínimo pra atleta segundo ISSN)
 *     - bulking: 1.8g/kg (suficiente em superávit; mais não traz benefício)
 *
 * - **Gordura** (1g = 9 kcal):
 *     27% das kcal totais. Nunca abaixo de 0.6g/kg pra preservar produção
 *     hormonal (Mountjoy, 2018, RED-S guidelines).
 *
 * - **Carboidrato** (1g = 4 kcal):
 *     Restante das kcal. Em déficit muito agressivo (não recomendado aqui)
 *     pode ficar muito baixo — por isso clampeamos em 0.
 */
export function calculateMacros(m: UserMetrics): Macros {
  const kcal = calculateKcalTarget(m);
  const protein_per_kg = m.goal === "cutting" ? 2.2 : m.goal === "bulking" ? 1.8 : 1.6;
  const protein_g = Math.round(m.weight_kg * protein_per_kg);
  const fat_g = Math.max(Math.round((m.weight_kg * 0.6)), Math.round((kcal * 0.27) / 9));
  const carb_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));
  return { kcal, protein_g, carb_g, fat_g };
}

/**
 * Tenta extrair UserMetrics válido de um row de profiles. Retorna null se
 * faltar qualquer campo essencial (UI deve cair pra "preencha seu perfil").
 */
export function metricsFromProfile(p: {
  weight_kg?: number | null;
  height_cm?: number | null;
  birth_date?: string | null;
  sex?: string | null;
  activity_level?: string | null;
  goal?: string | null;
}): UserMetrics | null {
  if (
    p.weight_kg == null ||
    p.height_cm == null ||
    !p.birth_date ||
    !p.sex ||
    !p.activity_level ||
    !p.goal
  )
    return null;
  if (p.sex !== "M" && p.sex !== "F" && p.sex !== "O") return null;
  if (!(p.activity_level in ACTIVITY_MULT)) return null;
  if (p.goal !== "cutting" && p.goal !== "maintenance" && p.goal !== "bulking") return null;
  return {
    weight_kg: Number(p.weight_kg),
    height_cm: Number(p.height_cm),
    birth_date: p.birth_date,
    sex: p.sex as Sex,
    activity_level: p.activity_level as ActivityLevel,
    goal: p.goal as Goal,
  };
}

/**
 * Perfil de referência usado pelas quantidades hardcoded no seed.sql.
 * Aproximação: homem 75kg, 175cm, ~30 anos, atividade moderada, manutenção.
 * Esse perfil corresponde a ~2400 kcal/dia, ~120g proteína, ~270g carbo,
 * ~73g gordura — bate com as quantidades base do seed (200g tilápia,
 * 120g batata-doce, etc).
 */
export const REFERENCE_PROFILE: UserMetrics = {
  weight_kg: 75,
  height_cm: 175,
  birth_date: "1995-01-01",
  sex: "M",
  activity_level: "moderate",
  goal: "maintenance",
};

export const REFERENCE_MACROS = calculateMacros(REFERENCE_PROFILE);

/**
 * Fator de escala pra ajustar quantidades do seed (calibradas pro
 * REFERENCE_PROFILE) ao perfil real do user.
 *
 * Aplicação: `quantidade_user = quantidade_seed × scaleFactor(user, role)`.
 *
 * Roles:
 * - protein: escala pela razão de proteína target (filé, ovos, leguminosas
 *   inteiras como peso de proteína principal)
 * - carb: escala pela razão de carbo target (arroz, batata, pão, tubérculos)
 * - fat: escala pela razão de gordura target (azeite, castanhas, abacate)
 * - volume: legumes/folhas/frutas — não escala, livre.
 */
export function scaleFactor(
  user: UserMetrics,
  role: "protein" | "carb" | "fat" | "volume",
): number {
  if (role === "volume") return 1;
  const u = calculateMacros(user);
  const r = REFERENCE_MACROS;
  if (role === "protein") return u.protein_g / r.protein_g;
  if (role === "carb") return u.carb_g / r.carb_g;
  if (role === "fat") return u.fat_g / r.fat_g;
  return 1;
}

/**
 * Aplica scaleFactor a uma quantidade textual ("200g", "1.2kg", "3 col sopa",
 * "1/2 xícara") e devolve a string ajustada. Reconhece unidades comuns em
 * receitas/listas de compras pt-BR. Quando não reconhece, devolve a string
 * original (fail-soft — melhor mostrar a base que mostrar erro).
 */
export function scaleQuantity(
  quantity: string,
  user: UserMetrics,
  role: "protein" | "carb" | "fat" | "volume",
): string {
  const factor = scaleFactor(user, role);
  if (factor === 1) return quantity;

  const trimmed = quantity.trim();

  // Match: "1,2kg", "600g", "1.5kg", "200 g", "30ml"
  const massMatch = trimmed.match(/^([\d]+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b(.*)$/i);
  if (massMatch) {
    const [, numStr, unit, rest] = massMatch;
    const num = parseFloat(numStr.replace(",", "."));
    const scaled = num * factor;
    return `${formatNumber(scaled)}${unit.toLowerCase()}${rest}`;
  }

  // Match: "30 unidades", "6 unidades", "2 cachos", "3 ovos"
  const countMatch = trimmed.match(/^([\d]+(?:[.,]\d+)?)\s*([a-zA-ZçãéíóúÁÉÍÓÚâêîôûÂÊÎÔÛ]+)(.*)$/);
  if (countMatch) {
    const [, numStr, unit, rest] = countMatch;
    const num = parseFloat(numStr.replace(",", "."));
    const scaled = num * factor;
    // Pra unidades discretas (unidades, ovos, cachos), arredonda pra inteiro
    const isDiscrete = /unidade|cacho|ovo|fati|posta|file/i.test(unit);
    const formatted = isDiscrete ? Math.max(1, Math.round(scaled)) : formatNumber(scaled);
    return `${formatted} ${unit}${rest}`;
  }

  return quantity; // fallback
}

function formatNumber(n: number): string {
  if (n >= 1) return n.toFixed(n % 1 === 0 ? 0 : 1).replace(".", ",");
  return n.toFixed(2).replace(".", ",");
}

/**
 * Infere o "role" macronutricional dominante de um item de receita/compra
 * a partir do nome em pt-BR. Heurística baseada em keyword matching de
 * alimentos comuns na cozinha brasileira.
 *
 * Critério: classifica pelo macro principal — não pelo perfil completo.
 * Tilapia tem ~20g proteína / 100g e <1g carbo → "protein".
 * Arroz tem ~28g carbo / 100g → "carb". Etc.
 *
 * Retorna "volume" pra alimentos de baixa densidade calórica (folhas,
 * frutas, legumes não-amiláceos) — nesse caso a quantidade não é escalada.
 */
const PROTEIN_KEYWORDS = [
  "frango", "peito", "carne", "patinho", "alcatra", "fil[eé]", "sardinha",
  "atum", "salm[aã]o", "tilapia", "til[áa]pia", "ovo", "ovos", "lombo",
  "pernil", "costela", "linguica", "linguiça", "presunto", "queijo",
  "iogurte", "whey", "amendoim", "feijao", "feijão", "lentilha", "grão",
  "soja", "tofu", "camar[aã]o", "polvo", "lula", "cordeiro", "carneiro",
  "pato", "fr[ií]o", "marreco", "carne moída", "carne moida", "patinho",
  "charque", "carne seca", "bode", "cabrito", "tambaqui", "pirarucu",
  "pintado", "pacu", "robalo", "badejo", "tucunar[eé]", "ostras", "siri",
];
const CARB_KEYWORDS = [
  "arroz", "batata", "mandioca", "fub[áa]", "aveia", "tapioca", "p[aã]o",
  "macarr[aã]o", "massa", "biscoito", "torrada", "pol(en|enta)", "cuscuz",
  "milho", "canjica", "quirera", "chipa", "bolo", "panqueca", "farinha",
  "cereal", "granola", "barra", "banana", "ma[çc][aã]", "abacaxi",
  "manga", "uva", "p[eê]ssego", "pera", "kiwi", "laranja", "tangerina",
  "mexerica", "mam[ãa]o", "melancia", "abacate",
];
const FAT_KEYWORDS = [
  "azeite", "[oó]leo", "manteiga", "castanha", "n[ou]z", "amêndoa",
  "amendoa", "abacate", "coco", "leite de coco", "tahine", "creme",
];

function matches(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(text));
}

export function inferFoodRole(name: string): "protein" | "carb" | "fat" | "volume" {
  const lower = name.toLowerCase();
  // Ordem importa: proteína > gordura > carbo (alguns alimentos como abacate
  // poderiam casar com mais de uma; queremos a categorização principal)
  if (matches(lower, PROTEIN_KEYWORDS)) return "protein";
  if (matches(lower, FAT_KEYWORDS)) return "fat";
  if (matches(lower, CARB_KEYWORDS)) return "carb";
  return "volume";
}

/**
 * Personaliza um item de refeição (string) com base no perfil científico do
 * user. Detecta o padrão "(L:Xunit·J:Yunit)" típico do plan_meals — onde
 * "L:" é a porção pra Luanthony (perfil ref ~75kg), "J:" pra Jéssica (~58kg) —
 * e substitui pela porção escalada pro user atual.
 *
 * Exemplos:
 *   "Tilápia grelhada (L:200g·J:150g)" + user 90kg →
 *     "Tilápia grelhada (240g)"  ← usa initial detectada do contexto
 *   "Arroz integral (L:3col·J:2col)" + user 60kg →
 *     "Arroz integral (2col)"
 *   "Brócolis no vapor"  → string inalterada (sem padrão ou role=volume)
 *
 * Se metrics for null, retorna a string original (fail-soft).
 */
const PERSONALIZE_PATTERN = /\((?:L|♂|H)\s*:?\s*([\d.,]+\s*[a-zA-Zçãéíóúâêîôû]+)\s*[··]?\s*(?:J|♀|M)\s*:?\s*[\d.,]+\s*[a-zA-Zçãéíóúâêîôû]+\)/i;
const PERSONALIZE_PATTERN_SOLO = /\((?:L|♂|H)\s*:?\s*([\d.,]+\s*[a-zA-Zçãéíóúâêîôû]+)\)/i;

export function personalizeMealItem(
  item: string,
  metrics: UserMetrics | null,
  initial?: string | null,
): string {
  if (!metrics) return item;
  const role = inferFoodRole(item);
  if (role === "volume") return item.replace(PERSONALIZE_PATTERN, "").replace(PERSONALIZE_PATTERN_SOLO, "").trim();

  const m = item.match(PERSONALIZE_PATTERN) ?? item.match(PERSONALIZE_PATTERN_SOLO);
  if (!m) return item;

  const baseQty = m[1].trim();
  const scaledQty = scaleQuantity(baseQty, metrics, role);
  const display = initial ? `${initial}: ${scaledQty}` : scaledQty;
  return item.replace(m[0], `(${display})`);
}

/**
 * Escala um número estimado de kcal (ex: ptl="~545") pelo ratio entre o
 * target calórico do user e o do perfil de referência.
 * Aceita formatos "~545", "545", "545kcal".
 */
export function personalizeKcal(text: string, metrics: UserMetrics | null): string {
  if (!metrics) return text;
  const m = text.match(/([\d.,]+)/);
  if (!m) return text;
  const baseKcal = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(baseKcal)) return text;

  const userTarget = calculateKcalTarget(metrics);
  const refTarget = calculateKcalTarget(REFERENCE_PROFILE);
  const factor = userTarget / refTarget;
  const scaled = Math.round(baseKcal * factor);
  return text.replace(m[1], String(scaled));
}
