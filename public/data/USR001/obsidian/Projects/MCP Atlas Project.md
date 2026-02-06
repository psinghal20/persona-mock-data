# MCP Atlas Project

## Overview
MCP Atlas is a comprehensive evaluation framework for Model Context Protocol (MCP) servers. It provides an agent environment for testing and benchmarking various MCP integrations.

## Goals
1. Create a standardized testing environment for MCP servers
2. Develop evaluation metrics for server performance
3. Build a library of mock data for testing
4. Document best practices for MCP server development

## Architecture

```
mcp-atlas/
├── services/
│   └── agent-environment/
│       ├── src/
│       ├── data/
│       └── Dockerfile
├── evaluations/
└── scripts/
```

## Current Status
- [x] Basic environment setup
- [x] Initial MCP server configurations
- [x] Git submodule integration
- [ ] Comprehensive mock data
- [ ] Automated testing pipeline
- [ ] Documentation

## Key Components

### Agent Environment
Docker-based environment that runs MCP servers in isolation. See [[Reference/Docker Setup]] for details.

### Server Template
JSON configuration file that defines available MCP servers. Located at:
`services/agent-environment/src/agent_environment/mcp_server_template.json`

### Supported Servers
Currently integrated servers:
- Filesystem operations
- GitHub integration
- Weather data
- Financial data (Alpaca, TwelveData)
- Search (Brave, DuckDuckGo, Exa)
- And many more...

## Team
- Lead: Pratyush Singhal
- Contributors: See GitHub

## Links
- [[Projects/API Integration Tasks]]
- [[Reference/MCP Protocol Spec]]

## Notes
### 2026-01-18
Added Obsidian MCP server to the template. Need to create mock vault data for testing.

### 2026-01-17
Fixed git submodule issues. All servers now properly initialized.

---
Tags: #project #mcp #active
