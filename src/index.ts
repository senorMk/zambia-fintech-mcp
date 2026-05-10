#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { calculateUnits } from "./tools/zesco-units.js";
import { getZmwRate, listSupportedQuotes } from "./tools/boz-rates.js";
import { quoteFee, listOperations, listProviders } from "./tools/momo-fees.js";
import {
  PAYE_BANDS_2024,
  grossToNet,
  netToGross,
  payslipFromAllowances,
} from "./tools/paye.js";

const server = new McpServer({
  name: "zambia-fintech-mcp",
  version: "0.1.0",
});

server.tool(
  "zesco_calculate_units",
  "Calculate kWh units received for a ZESCO prepaid purchase amount in ZMW. Applies the residential T1/T2/T3 tariff bands.",
  { amountKwacha: z.number().positive() },
  async ({ amountKwacha }) => {
    const quote = calculateUnits(amountKwacha);
    return {
      content: [{ type: "text", text: JSON.stringify(quote, null, 2) }],
    };
  },
);

server.tool(
  "boz_exchange_rate",
  "Get an indicative ZMW exchange rate against a quote currency. v0.1 returns stub data — wire to BOZ daily rate sheet for production.",
  { quoteCurrency: z.string().length(3) },
  async ({ quoteCurrency }) => {
    const rate = getZmwRate(quoteCurrency);
    return {
      content: [{ type: "text", text: JSON.stringify(rate, null, 2) }],
    };
  },
);

server.tool(
  "boz_list_supported_quotes",
  "List the quote currencies supported by the boz_exchange_rate tool.",
  {},
  async () => ({
    content: [{ type: "text", text: listSupportedQuotes().join(", ") }],
  }),
);

server.tool(
  "momo_quote_fee",
  "Quote the fee for a Zambian mobile money operation in ZMW. Returns operator fee and government levy as separate components, plus the schedule's effective date and source URL. Use momo_list_operations to discover what operations a given provider supports.",
  {
    provider: z.enum(["MTN", "Airtel", "Zamtel"]),
    operation: z.string(),
    amountKwacha: z.number().positive(),
    asOf: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  },
  async ({ provider, operation, amountKwacha, asOf }) => {
    const fee = quoteFee(provider, operation, amountKwacha, asOf);
    return {
      content: [{ type: "text", text: JSON.stringify(fee, null, 2) }],
    };
  },
);

server.tool(
  "momo_list_operations",
  "List the operations defined in the active fee schedule for a provider (e.g. send_same_network, send_cross_network, send_to_bank, withdraw_at_agent).",
  {
    provider: z.enum(["MTN", "Airtel", "Zamtel"]),
    asOf: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  },
  async ({ provider, asOf }) => ({
    content: [{ type: "text", text: listOperations(provider, asOf).join(", ") }],
  }),
);

server.tool(
  "momo_list_providers",
  "List the mobile money providers with at least one fee schedule loaded.",
  {},
  async () => ({
    content: [{ type: "text", text: listProviders().join(", ") }],
  }),
);

server.tool(
  "paye_gross_to_net",
  "Calculate Zambian monthly net pay from gross. Returns PAYE, NAPSA, and per-band tax breakdown. Uses 2024 ZRA bands — verify against latest budget.",
  { grossKwacha: z.number().nonnegative() },
  async ({ grossKwacha }) => ({
    content: [
      { type: "text", text: JSON.stringify(grossToNet(grossKwacha), null, 2) },
    ],
  }),
);

server.tool(
  "paye_net_to_gross",
  "Reverse-solve the gross monthly pay required to land at a desired net (after PAYE + NAPSA). Useful for offer negotiation and take-home targeting.",
  { desiredNetKwacha: z.number().nonnegative() },
  async ({ desiredNetKwacha }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(netToGross(desiredNetKwacha), null, 2),
      },
    ],
  }),
);

server.tool(
  "paye_from_allowances",
  "Build a payslip from a basic-plus-allowances structure (basic + housing + transport + other taxable). Returns the same PAYE/NAPSA breakdown plus component totals.",
  {
    basicKwacha: z.number().nonnegative(),
    housingKwacha: z.number().nonnegative().optional(),
    transportKwacha: z.number().nonnegative().optional(),
    otherTaxableKwacha: z.number().nonnegative().optional(),
  },
  async (input) => ({
    content: [
      { type: "text", text: JSON.stringify(payslipFromAllowances(input), null, 2) },
    ],
  }),
);

server.tool(
  "paye_bands",
  "Return the PAYE bands the calculator is using, so callers can audit assumptions or compare against the current ZRA schedule.",
  {},
  async () => ({
    content: [{ type: "text", text: JSON.stringify(PAYE_BANDS_2024, null, 2) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("zambia-fintech-mcp ready on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
