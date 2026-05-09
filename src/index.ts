#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { calculateUnits } from "./tools/zesco-units.js";
import { getZmwRate, listSupportedQuotes } from "./tools/boz-rates.js";
import { quoteFee } from "./tools/momo-fees.js";

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
  "Quote the fee for an MTN MoMo or Airtel Money operation in ZMW. Fee tiers are illustrative — verify with the provider before production use.",
  {
    provider: z.enum(["MTN", "Airtel"]),
    operation: z.enum(["send_to_user", "withdraw_at_agent"]),
    amountKwacha: z.number().positive(),
  },
  async ({ provider, operation, amountKwacha }) => {
    const fee = quoteFee(provider, operation, amountKwacha);
    return {
      content: [{ type: "text", text: JSON.stringify(fee, null, 2) }],
    };
  },
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
