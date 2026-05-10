import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";

const TierSchema = z.object({
  upTo: z.number().positive(),
  operatorFee: z.number().nonnegative(),
  levy: z.number().nonnegative(),
});

const OperationSchema = z.object({
  levyApplies: z.boolean(),
  tiers: z.array(TierSchema).min(1),
});

const ScheduleSchema = z.object({
  provider: z.enum(["MTN", "Airtel", "Zamtel"]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.literal("ZMW"),
  source: z.object({ name: z.string(), url: z.string().url() }),
  operations: z.record(z.string(), OperationSchema),
});

export type Tier = z.infer<typeof TierSchema>;
export type FeeSchedule = z.infer<typeof ScheduleSchema>;
export type Provider = FeeSchedule["provider"];

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

const SCHEDULES: FeeSchedule[] = loadSchedules();

function loadSchedules(): FeeSchedule[] {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    const parsed = ScheduleSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid schedule ${file}: ${parsed.error.message}`);
    }
    for (const op of Object.values(parsed.data.operations)) {
      let prev = 0;
      for (const tier of op.tiers) {
        if (tier.upTo <= prev) {
          throw new Error(`Schedule ${file}: tiers must be strictly ascending`);
        }
        prev = tier.upTo;
      }
    }
    return parsed.data;
  });
}

function pickSchedule(provider: Provider, asOf?: string): FeeSchedule {
  const date = asOf ?? new Date().toISOString().slice(0, 10);
  const candidates = SCHEDULES.filter(
    (s) => s.provider === provider && s.effectiveFrom <= date,
  ).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  if (candidates.length === 0) {
    throw new Error(`No fee schedule for ${provider} on or before ${date}`);
  }
  return candidates[0];
}

export type FeeQuote = {
  provider: Provider;
  operation: string;
  amountKwacha: number;
  tier: Tier;
  operatorFeeKwacha: number;
  levyKwacha: number;
  totalFeeKwacha: number;
  totalKwacha: number;
  source: { name: string; url: string; effectiveFrom: string };
};

export function quoteFee(
  provider: Provider,
  operation: string,
  amountKwacha: number,
  asOf?: string,
): FeeQuote {
  if (amountKwacha <= 0) throw new Error("Amount must be greater than zero");
  const schedule = pickSchedule(provider, asOf);
  const op = schedule.operations[operation];
  if (!op) {
    throw new Error(
      `Operation "${operation}" not defined for ${provider}. Available: ${Object.keys(
        schedule.operations,
      ).join(", ")}`,
    );
  }
  const tier = op.tiers.find((t) => amountKwacha <= t.upTo);
  if (!tier) {
    throw new Error(
      `Amount ${amountKwacha} exceeds the highest tier (${op.tiers[op.tiers.length - 1].upTo}) for ${provider}/${operation}`,
    );
  }
  const operatorFee = tier.operatorFee;
  const levy = op.levyApplies ? tier.levy : 0;
  const totalFee = round2(operatorFee + levy);
  return {
    provider,
    operation,
    amountKwacha,
    tier,
    operatorFeeKwacha: operatorFee,
    levyKwacha: levy,
    totalFeeKwacha: totalFee,
    totalKwacha: round2(amountKwacha + totalFee),
    source: {
      name: schedule.source.name,
      url: schedule.source.url,
      effectiveFrom: schedule.effectiveFrom,
    },
  };
}

export function listOperations(provider: Provider, asOf?: string): string[] {
  return Object.keys(pickSchedule(provider, asOf).operations);
}

export function listProviders(): Provider[] {
  return Array.from(new Set(SCHEDULES.map((s) => s.provider)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
