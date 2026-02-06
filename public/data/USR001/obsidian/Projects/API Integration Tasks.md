# API Integration Tasks

## Overview
Tracking all API integration work for the MCP Atlas project.

## Completed Integrations

### Financial APIs
- [x] Alpaca - Stock trading API
- [x] TwelveData - Market data
- [x] Coinbase (via data export)
- [x] Borsa MCP - Turkish stock market

### Search APIs
- [x] Brave Search
- [x] DuckDuckGo
- [x] Exa
- [x] Wikipedia

### Utility APIs
- [x] Weather
- [x] Google Maps
- [x] arXiv
- [x] PubMed

## In Progress

### Knowledge Management
- [ ] Obsidian - Personal vault integration
- [ ] Notion - Team workspace

### E-commerce
- [ ] Shopping MCP server
- [ ] Terminal.shop
- [ ] Coles/Woolworths

## Planned

### Communication
- [ ] Email integration
- [ ] Calendar sync
- [ ] Messaging platforms

### Data Sources
- [ ] Database connectors
- [ ] Spreadsheet integration

## API Key Management
All API keys are stored as environment variables:
```
BRAVE_API_KEY
ALPACA_API_KEY
ALPACA_SECRET_KEY
WEATHER_API_KEY
...
```

See `.env.template` for complete list.

## Integration Guidelines
1. Always use versioned packages where possible
2. Document required environment variables
3. Add to `install_mcp_packages.sh` for npx packages
4. Consider adding to `CACHEABLE_SERVERS` in main.py

---
Tags: #project #api #integration
