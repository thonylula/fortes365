// Frutas sazonais por região + mês (month_id 0=Jan ... 11=Dez).
// Baseado em calendário frutífero tradicional brasileiro por bioma.

type Region = "nordeste" | "norte" | "sudeste" | "sul" | "centro_oeste";

const FRUITS_BY_REGION: Record<Region, Record<number, string>> = {
  nordeste: {
    0: "Manga · Caju · Umbu",
    1: "Caju · Graviola · Pitanga",
    2: "Pitanga · Cajá · Jaca",
    3: "Maracujá · Umbu · Goiaba",
    4: "Seriguela · Jaca · Acerola",
    5: "Goiaba · Laranja · Tamarindo",
    6: "Laranja · Mandarina · Acerola",
    7: "Mamão · Banana · Coco",
    8: "Melancia · Abacaxi · Manga",
    9: "Manga nova · Acerola · Caju",
    10: "Manga · Caju · Cajá",
    11: "Manga plena · Caju · Umbu",
  },
  norte: {
    0: "Cupuaçu · Taperebá · Banana pacovã",
    1: "Açaí · Bacuri · Cupuaçu",
    2: "Abiu · Buriti · Taperebá",
    3: "Castanha · Cupuaçu · Pupunha",
    4: "Tucumã · Pupunha · Bacuri",
    5: "Açaí · Cubiu · Biribá",
    6: "Laranja-da-terra · Limão-galego · Murici",
    7: "Mamão · Graviola · Bacuri",
    8: "Melancia · Banana · Cupuaçu",
    9: "Pupunha · Taperebá · Açaí",
    10: "Cupuaçu · Açaí · Castanha",
    11: "Cupuaçu · Castanha · Bacuri",
  },
  sudeste: {
    0: "Manga · Jabuticaba · Abacaxi",
    1: "Jabuticaba · Maracujá · Abacaxi",
    2: "Maçã · Pêssego · Goiaba",
    3: "Caqui · Goiaba · Tangerina",
    4: "Tangerina · Pera · Caqui",
    5: "Laranja · Tangerina · Morango",
    6: "Laranja · Mexerica · Morango",
    7: "Morango · Pêssego · Abacate",
    8: "Morango · Abacate · Ameixa",
    9: "Maçã · Jabuticaba · Manga",
    10: "Manga · Abacaxi · Caju",
    11: "Manga · Pêssego · Abacaxi",
  },
  sul: {
    0: "Pêssego · Ameixa · Uva",
    1: "Uva · Figo · Pêssego",
    2: "Uva · Kiwi · Maçã",
    3: "Maçã · Pera · Kiwi",
    4: "Pera · Caqui · Maçã",
    5: "Bergamota · Pera · Caqui",
    6: "Bergamota · Kiwi · Laranja",
    7: "Morango · Kiwi · Nêspera",
    8: "Nêspera · Morango · Amora",
    9: "Morango · Pêssego novo · Amora",
    10: "Pêssego · Ameixa · Cereja",
    11: "Uva · Pêssego · Figo",
  },
  centro_oeste: {
    0: "Manga · Jabuticaba · Abacaxi",
    1: "Pequi · Mangaba · Manga",
    2: "Pequi · Cagaita · Mangaba",
    3: "Araticum · Cagaita · Goiaba",
    4: "Buriti · Jatobá · Araticum",
    5: "Laranja · Tangerina · Jatobá",
    6: "Laranja · Mexerica · Murici",
    7: "Guariroba · Murici · Jenipapo",
    8: "Mangaba · Pequi novo · Jenipapo",
    9: "Murici · Pequi · Baru",
    10: "Pequi (safra) · Mangaba · Baru",
    11: "Manga · Pequi · Baru",
  },
};

export function getFruitsForMonth(region: string, monthId: number): string {
  const r = (region as Region) in FRUITS_BY_REGION ? (region as Region) : "nordeste";
  return FRUITS_BY_REGION[r][monthId] ?? "";
}
