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

## Roadmap

- [ ] Live BOZ daily rate sheet ingestion
- [ ] Confirmed MTN / Airtel published tariffs
- [ ] LuSE ticker tool
- [ ] PAYE / income tax calculator (ZRA bands)
- [ ] Loan affordability calculator (NAPSA / pension contribution aware)

## License

MIT © Penjani Mkandawire
