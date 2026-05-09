export type FxQuote = {
  base: "ZMW";
  quote: string;
  bid: number;
  ask: number;
  asOf: string;
  source: "stub";
};

const STUB_RATES: Record<string, { bid: number; ask: number }> = {
  USD: { bid: 0.0367, ask: 0.0372 },
  EUR: { bid: 0.0339, ask: 0.0344 },
  GBP: { bid: 0.0289, ask: 0.0293 },
  ZAR: { bid: 0.681, ask: 0.689 },
};

export function getZmwRate(quote: string): FxQuote {
  const upper = quote.toUpperCase();
  const r = STUB_RATES[upper];
  if (!r) {
    throw new Error(
      `No stub rate for ZMW/${upper}. Supported: ${Object.keys(STUB_RATES).join(", ")}`,
    );
  }
  return {
    base: "ZMW",
    quote: upper,
    bid: r.bid,
    ask: r.ask,
    asOf: new Date().toISOString().slice(0, 10),
    source: "stub",
  };
}

export function listSupportedQuotes(): string[] {
  return Object.keys(STUB_RATES);
}
