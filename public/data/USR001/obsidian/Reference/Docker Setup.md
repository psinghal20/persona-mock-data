# Docker Setup

## Basic Commands

### Container Management
```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Start/stop container
docker start <container_id>
docker stop <container_id>

# Remove container
docker rm <container_id>

# View logs
docker logs -f <container_id>
```

### Image Management
```bash
# List images
docker images

# Pull image
docker pull <image_name>

# Build image
docker build -t <name>:<tag> .

# Remove image
docker rmi <image_id>
```

### Docker Compose
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f
```

## Dockerfile Best Practices

### Multi-stage Builds
```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### Layer Caching
- Order commands from least to most frequently changing
- Combine RUN commands to reduce layers
- Use .dockerignore

## MCP Atlas Docker Setup

### Environment File
```env
BRAVE_API_KEY=xxx
ALPACA_API_KEY=xxx
# ... other keys
```

### Running the Agent Environment
```bash
cd services/agent-environment
docker build -t mcp-agent .
docker run -it --env-file .env mcp-agent
```

### Volume Mounts
```bash
docker run -v $(pwd)/data:/data mcp-agent
```

## Troubleshooting

### Common Issues
1. **Port already in use**: `docker ps` to find conflicting container
2. **Permission denied**: Check volume mount permissions
3. **Out of space**: `docker system prune`

### Useful Debug Commands
```bash
# Shell into running container
docker exec -it <container_id> /bin/bash

# Inspect container
docker inspect <container_id>

# Check resource usage
docker stats
```

---
Tags: #reference #docker #devops
