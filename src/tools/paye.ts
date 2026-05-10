/**
 * Zambian PAYE & NAPSA monthly calculator.
 *
 * Bands below reflect the 2024 ZRA PAYE schedule. Verify against the latest
 * national budget before relying on these values in production — bands and
 * the NAPSA ceiling are revised in most annual budgets.
 */

export type PayeBand = {
  from: number;
  to: number;
  rate: number;
};

export const PAYE_BANDS_2024: PayeBand[] = [
  { from: 0, to: 5100, rate: 0.0 },
  { from: 5100, to: 7100, rate: 0.2 },
  { from: 7100, to: 9200, rate: 0.3 },
  { from: 9200, to: Infinity, rate: 0.37 },
];

export const NAPSA_RATE = 0.05;
export const NAPSA_CEILING_GROSS = 24_436;

export type PayslipBreakdown = {
  grossKwacha: number;
  taxableKwacha: number;
  payeKwacha: number;
  napsaKwacha: number;
  netKwacha: number;
  bandsApplied: { band: PayeBand; portion: number; tax: number }[];
  assumptions: string;
};

const STANDARD_ASSUMPTIONS =
  "Monthly figures, ZMW. Assumes resident individual under 65, no pension/medical " +
  "deductions beyond NAPSA, no housing/transport allowance carve-outs, and 2024 PAYE bands. " +
  "Verify against latest ZRA schedule before production use.";

export function calculateNapsa(grossKwacha: number): number {
  const base = Math.min(grossKwacha, NAPSA_CEILING_GROSS);
  return round2(base * NAPSA_RATE);
}

export function calculatePaye(
  grossKwacha: number,
  bands: PayeBand[] = PAYE_BANDS_2024,
): { paye: number; bandsApplied: PayslipBreakdown["bandsApplied"] } {
  const bandsApplied: PayslipBreakdown["bandsApplied"] = [];
  let paye = 0;
  for (const band of bands) {
    if (grossKwacha <= band.from) break;
    const portion = Math.min(grossKwacha, band.to) - band.from;
    const tax = portion * band.rate;
    paye += tax;
    bandsApplied.push({ band, portion: round2(portion), tax: round2(tax) });
  }
  return { paye: round2(paye), bandsApplied };
}

export function grossToNet(
  grossKwacha: number,
  bands: PayeBand[] = PAYE_BANDS_2024,
): PayslipBreakdown {
  if (grossKwacha < 0) throw new Error("Gross must be non-negative");
  const napsa = calculateNapsa(grossKwacha);
  const { paye, bandsApplied } = calculatePaye(grossKwacha, bands);
  return {
    grossKwacha: round2(grossKwacha),
    taxableKwacha: round2(grossKwacha),
    payeKwacha: paye,
    napsaKwacha: napsa,
    netKwacha: round2(grossKwacha - paye - napsa),
    bandsApplied,
    assumptions: STANDARD_ASSUMPTIONS,
  };
}

/**
 * Reverse-solve gross from a desired net via bisection. The PAYE+NAPSA
 * function is monotonically non-decreasing in gross, so bisection converges.
 */
export function netToGross(
  desiredNetKwacha: number,
  bands: PayeBand[] = PAYE_BANDS_2024,
): PayslipBreakdown {
  if (desiredNetKwacha < 0) throw new Error("Desired net must be non-negative");

  let lo = desiredNetKwacha;
  let hi = desiredNetKwacha * 2 + 10_000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const net = grossToNet(mid, bands).netKwacha;
    if (Math.abs(net - desiredNetKwacha) < 0.005) {
      return grossToNet(mid, bands);
    }
    if (net < desiredNetKwacha) lo = mid;
    else hi = mid;
  }
  return grossToNet((lo + hi) / 2, bands);
}

export type AllowanceInput = {
  basicKwacha: number;
  housingKwacha?: number;
  transportKwacha?: number;
  otherTaxableKwacha?: number;
};

export type AllowanceBreakdown = PayslipBreakdown & {
  components: {
    basic: number;
    housing: number;
    transport: number;
    otherTaxable: number;
  };
};

/**
 * Sum the standard allowance components into a gross figure, then run the
 * normal PAYE/NAPSA calc. All components are treated as fully taxable in
 * v0.1 — refine if you want housing/transport carve-outs.
 */
export function payslipFromAllowances(
  input: AllowanceInput,
  bands: PayeBand[] = PAYE_BANDS_2024,
): AllowanceBreakdown {
  const housing = input.housingKwacha ?? 0;
  const transport = input.transportKwacha ?? 0;
  const otherTaxable = input.otherTaxableKwacha ?? 0;
  const gross = input.basicKwacha + housing + transport + otherTaxable;
  const breakdown = grossToNet(gross, bands);
  return {
    ...breakdown,
    components: {
      basic: round2(input.basicKwacha),
      housing: round2(housing),
      transport: round2(transport),
      otherTaxable: round2(otherTaxable),
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
