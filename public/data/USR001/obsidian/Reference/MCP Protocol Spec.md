# MCP Protocol Specification

## Overview
The Model Context Protocol (MCP) is a standardized protocol for connecting AI models to external data sources and tools.

## Core Concepts

### Servers
MCP servers provide:
- **Tools**: Executable functions the model can call
- **Resources**: Data the model can read
- **Prompts**: Templates for common tasks

### Communication
- JSON-RPC 2.0 over stdio
- Request/response pattern
- Notification support

## Server Configuration

### JSON Format
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["package-name@version"],
      "env": {
        "API_KEY": "${ENV_VAR}"
      }
    }
  }
}
```

### Command Types
- `npx`: Node.js packages
- `uvx`: Python packages (via uv)
- `node`: Local JavaScript files
- `python`: Local Python scripts

## Tool Definition

### Schema
```json
{
  "name": "tool_name",
  "description": "What the tool does",
  "inputSchema": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "Parameter description"
      }
    },
    "required": ["param1"]
  }
}
```

## Best Practices

### Server Development
1. Use clear, descriptive tool names
2. Provide detailed descriptions
3. Validate inputs thoroughly
4. Return structured responses
5. Handle errors gracefully

### Security
- Never expose sensitive data in tool outputs
- Validate and sanitize inputs
- Use environment variables for credentials
- Implement rate limiting

### Performance
- Cache responses where appropriate
- Minimize network calls
- Use efficient data structures
- Consider async operations

## Example: Weather Server

### Tool: get_weather
```json
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "inputSchema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name or coordinates"
      }
    },
    "required": ["location"]
  }
}
```

### Response
```json
{
  "temperature": 72,
  "unit": "fahrenheit",
  "condition": "sunny",
  "humidity": 45
}
```

## Resources
- [Official MCP Documentation](https://modelcontextprotocol.io)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- [[Projects/MCP Atlas Project]]

---
Tags: #reference #mcp #protocol
