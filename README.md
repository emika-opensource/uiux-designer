# Design Studio — Emika AI Employee

AI-powered UI/UX designer companion app with Figma MCP integration, design reference management, RAG knowledge base, design system documentation, and design review tools.

## Features

- **Design References** — Save, tag, like, and explore design inspiration. Moodboard view for liked references.
- **Design System** — Document colors, typography, spacing, components, and principles.
- **Knowledge Base** — Upload brand guidelines, style guides, and design docs with BM25 search.
- **Design Reviews** — Structured audits with findings, severity levels, and scores.
- **Projects** — Track design projects through discovery to handoff.
- **Figma Integration** — Connect via MCP to read/write Figma files directly.
- **Style Preferences** — Like references to train the AI on your aesthetic taste.

## Stack

- Express.js server with JSON file storage
- Static SPA frontend (vanilla JS)
- BM25 search engine for knowledge base
- Figma MCP server integration

## Quick Start

```bash
npm install
node server.js
# → http://localhost:3000
```

## MCP Configuration

Add to your MCP servers config:
```json
{
  "figma": {
    "command": "npx",
    "args": ["-y", "figma-developer/figma-mcp"],
    "env": {
      "FIGMA_PERSONAL_ACCESS_TOKEN": "<your-token>"
    }
  }
}
```
