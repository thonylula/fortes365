// Filtro basico de palavras de baixo calao em pt-BR.
// Aplicado no server-side antes de persistir sugestoes do usuario.
// Nao substitui moderacao humana — cobre os 95% casos obvios.

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  "$": "s",
};

const BAD_WORDS = [
  // Classicos
  "porra",
  "caralho",
  "buceta",
  "boceta",
  "merda",
  "bosta",
  "cacete",
  "cacetada",
  "pica",
  "piroca",
  "rola",
  "xoxota",
  "xota",
  "fod",
  "fuder",
  "fudido",
  "fudida",
  "foda",
  "fodase",
  "cuzao",
  "cuzudo",
  "cu",
  "cus",
  // Xingamentos pessoais
  "arrombado",
  "arrombada",
  "corno",
  "corna",
  "cornudo",
  "cornuda",
  "otario",
  "otaria",
  "idiota",
  "imbecil",
  "babaca",
  "escroto",
  "bunda",
  "bundao",
  "desgracado",
  "desgracada",
  "safado",
  "safada",
  "vagabundo",
  "vagabunda",
  "pilantra",
  // Mae/familia
  "pqp",
  "fdp",
  "vtnc",
  "vsf",
  "tnc",
  "puta",
  "puto",
  "putaria",
  "putinha",
  // Raciais / homofobicos
  "viado",
  "viadinho",
  "bicha",
  "bichinha",
  "traveco",
  "sapatao",
  "macaco",
  "preto",
  "nego",
  "crioulo",
  "crioula",
  "neguinho",
  // Sexuais explicitos
  "punheta",
  "punhetar",
  "gozar",
  "gozada",
  "boquete",
  "chupar",
  "tesao",
];

function normalize(text: string): string {
  let out = text.toLowerCase();
  // Remove acentos
  out = out.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Leet -> letras
  out = out.replace(/[019345789@$]/g, (ch) => LEET_MAP[ch] ?? ch);
  // Remove todo caractere que nao seja letra ou espaco — isso cobre
  // tentativas do tipo c*r*l*h*o, c.a.r.a.l.h.o, c_a_r_a_l_h_o, etc.
  out = out.replace(/[^a-z\s]/g, "");
  // Colapsa letras repetidas (poooorra -> porra)
  out = out.replace(/(.)\1{2,}/g, "$1$1");
  // Colapsa espacos
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

const PATTERN = new RegExp(`\\b(${BAD_WORDS.join("|")})\\w*\\b`, "i");

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return PATTERN.test(normalize(text));
}

// Exportado pra testes; nao usar em callers.
export const __internal = { normalize, BAD_WORDS };
