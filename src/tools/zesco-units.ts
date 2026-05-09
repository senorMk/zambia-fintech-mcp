const TARIFF_1_RATE = 0.56;
const TARIFF_2_RATE = 1.01;
const TARIFF_3_RATE = 2.31;

const TARIFF_1_MAX_COST = 56;
const TARIFF_2_MAX_COST = 202;

const TARIFF_1_MAX_UNITS = 100;
const TARIFF_1_AND_2_MAX_UNITS = 300;

export type ZescoQuote = {
  amountKwacha: number;
  units: number;
  tariffsHit: ("T1" | "T2" | "T3")[];
};

export function calculateUnits(amountKwacha: number): ZescoQuote {
  if (amountKwacha <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (amountKwacha <= TARIFF_1_MAX_COST) {
    return {
      amountKwacha,
      units: amountKwacha / TARIFF_1_RATE,
      tariffsHit: ["T1"],
    };
  }

  const afterT1 = amountKwacha - TARIFF_1_MAX_COST;
  if (afterT1 <= TARIFF_2_MAX_COST) {
    return {
      amountKwacha,
      units: TARIFF_1_MAX_UNITS + afterT1 / TARIFF_2_RATE,
      tariffsHit: ["T1", "T2"],
    };
  }

  const afterT2 = afterT1 - TARIFF_2_MAX_COST;
  return {
    amountKwacha,
    units: TARIFF_1_AND_2_MAX_UNITS + afterT2 / TARIFF_3_RATE,
    tariffsHit: ["T1", "T2", "T3"],
  };
}
