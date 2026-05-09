export type Provider = "MTN" | "Airtel";
export type Operation = "send_to_user" | "withdraw_at_agent";

type Tier = { upTo: number; fee: number };

const TABLES: Record<Provider, Record<Operation, Tier[]>> = {
  MTN: {
    send_to_user: [
      { upTo: 50, fee: 0.5 },
      { upTo: 250, fee: 2.5 },
      { upTo: 1000, fee: 7.0 },
      { upTo: 5000, fee: 20.0 },
      { upTo: Infinity, fee: 50.0 },
    ],
    withdraw_at_agent: [
      { upTo: 50, fee: 1.0 },
      { upTo: 250, fee: 4.0 },
      { upTo: 1000, fee: 12.0 },
      { upTo: 5000, fee: 35.0 },
      { upTo: Infinity, fee: 80.0 },
    ],
  },
  Airtel: {
    send_to_user: [
      { upTo: 50, fee: 0.5 },
      { upTo: 250, fee: 2.5 },
      { upTo: 1000, fee: 7.0 },
      { upTo: 5000, fee: 20.0 },
      { upTo: Infinity, fee: 50.0 },
    ],
    withdraw_at_agent: [
      { upTo: 50, fee: 1.0 },
      { upTo: 250, fee: 4.0 },
      { upTo: 1000, fee: 12.0 },
      { upTo: 5000, fee: 35.0 },
      { upTo: Infinity, fee: 80.0 },
    ],
  },
};

export type FeeQuote = {
  provider: Provider;
  operation: Operation;
  amountKwacha: number;
  feeKwacha: number;
  totalKwacha: number;
  source: "stub";
  notes: string;
};

export function quoteFee(
  provider: Provider,
  operation: Operation,
  amountKwacha: number,
): FeeQuote {
  if (amountKwacha <= 0) throw new Error("Amount must be greater than zero");
  const tiers = TABLES[provider][operation];
  const tier = tiers.find((t) => amountKwacha <= t.upTo)!;
  return {
    provider,
    operation,
    amountKwacha,
    feeKwacha: tier.fee,
    totalKwacha: amountKwacha + tier.fee,
    source: "stub",
    notes:
      "Fee tiers are illustrative and may not reflect current published tariffs. Verify with the provider before use in production.",
  };
}
