# zambia-fintech-mcp

A Model Context Protocol (MCP) server that gives AI assistants access to
Zambia-specific financial utilities — exchange rates, ZESCO prepaid unit
calculations, and mobile money fee quoting.

Built so you can ask Claude / Cursor / any MCP-aware client things like:

> *"How many ZESCO units do I get for K200?"*
> *"What's the MTN fee on sending K1,500 to another user?"*
> *"What's today's ZMW/USD rate?"*

…and have it actually answer with structured data.

## Tools

| Tool | What it does |
| --- | --- |
| `zesco_calculate_units` | Returns kWh units for a kwacha purchase amount, applying T1/T2/T3 residential bands |
| `boz_exchange_rate` | ZMW → quote-currency indicative rate (stubbed in v0.1) |
| `boz_list_supported_quotes` | Lists currencies the rate tool knows about |
| `momo_quote_fee` | Quotes MTN / Airtel send & withdraw fees by amount tier |
| `paye_gross_to_net` | Monthly PAYE + NAPSA → net take-home, with per-band breakdown |
| `paye_net_to_gross` | Reverse: solve the gross required to land at a desired net |
| `paye_from_allowances` | Payslip from basic + housing + transport + other taxable |
| `paye_bands` | Returns the PAYE bands in use so callers can audit assumptions |

## Install

```bash
npm install
npm run build
```

## Use with Claude Desktop / Claude Code

Add to your MCP config:

```json
{
  "mcpServers": {
    "zambia-fintech": {
      "command": "node",
      "args": ["/absolute/path/to/zambia-fintech-mcp/dist/index.js"]
    }
  }
}
```

## v0.1 — what's real, what's stub

| Tool | Status |
| --- | --- |
| ZESCO units | **Real.** Logic ported from [zesco-units-calculator](https://github.com/senorMk/zesco-units-calculator). |
| Mobile money fees | **Stub tables.** Tier shapes are accurate; exact fee values are illustrative — verify with provider before production. |
| BOZ rates | **Stub.** Returns plausible values. Roadmap: scrape the BOZ daily rate sheet PDF or wire to a published JSON feed. |
| PAYE / NAPSA | **Real, but pinned to 2024 bands.** Update `PAYE_BANDS_2024` and `NAPSA_CEILING_GROSS` after each national budget. |

## Roadmap

- [ ] Live BOZ daily rate sheet ingestion
- [ ] Confirmed MTN / Airtel published tariffs
- [ ] LuSE ticker tool
- [ ] Annual budget auto-update for PAYE bands
- [ ] Loan affordability calculator (NAPSA / pension contribution aware)
- [ ] Housing/transport allowance carve-out support

## License

MIT © Penjani Mkandawire
