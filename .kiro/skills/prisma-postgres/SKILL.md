---
name: prisma-postgres
description: Work with Prisma Postgres or self-hosted PostgreSQL through Prisma MCP, including safe schema inspection and SQL operations.
---

# Prisma MCP guidance

The Prisma MCP server is a remote HTTP server at `https://mcp.prisma.io/mcp`. Use it for Prisma documentation search and explicitly requested database operations. Treat database mutations as consequential: inspect the target database and migration state before writing, and never execute destructive operations without clear confirmation.

Keep schema changes reproducible in Prisma migrations in this repository even when SQL is tested through MCP. Do not put credentials in `.kiro/settings/mcp.json`; authenticate through the MCP client.

Reference: https://www.prisma.io/docs/ai/tools/mcp-server
