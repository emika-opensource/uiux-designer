---
name: uiux-designer
description: AI design assistant with references, design system management, knowledge base (RAG), design reviews, project tracking, and Figma integration
---

## ⛔ NEVER write data as files. ALWAYS use the API.

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.

## 🚨 Your App is ALREADY RUNNING
Your **Design Studio** web application is ALREADY RUNNING on port 3000.
- **DO NOT** kill anything on port 3000
- **DO NOT** try to start a new server
- All API endpoints below are served by this app at `http://localhost:3000`

## 📁 File Uploads
Upload knowledge base documents (PDF, MD, TXT, HTML — max 50MB):
```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@brand-guidelines.pdf" \
  -F "name=Brand Guidelines" \
  -F "category=brand-guidelines" \
  -F 'tags=["brand","typography","colors"]'
```

## API Endpoints Summary

| Category | Endpoints |
|----------|-----------|
| References | `GET/POST /api/references`, `GET /api/references/liked`, `GET /api/references/styles`, `PUT/DELETE /api/references/:id` |
| Design System | `GET/PUT /api/design-system`, `POST /api/design-system/extract` |
| Documents (KB) | `GET/POST /api/documents`, `GET/DELETE /api/documents/:id` |
| Search | `GET /api/search?q=...` |
| Reviews | `GET/POST /api/reviews`, `PUT/DELETE /api/reviews/:id` |
| Projects | `GET/POST /api/projects`, `PUT/DELETE /api/projects/:id` |
| Config | `GET/PUT /api/config` |
| Analytics | `GET /api/analytics` |

## Detailed API Reference

### References

**List references** (with filters):
```bash
curl http://localhost:3000/api/references
curl "http://localhost:3000/api/references?category=landing-page&style=minimal&liked=true"
curl "http://localhost:3000/api/references?platform=web&search=dashboard&source=dribbble"
```
Filter params: `category`, `style`, `platform`, `liked`, `source`, `search`.

**Get liked references**:
```bash
curl http://localhost:3000/api/references/liked
```

**Get style analysis** (from liked references):
```bash
curl http://localhost:3000/api/references/styles
```
Response: `{ "totalLiked": 10, "styles": { "minimal": 5, "bold": 3 }, "categories": {...}, "colors": {...} }`

**Create a reference**:
```bash
curl -X POST http://localhost:3000/api/references \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Dashboard Design",
    "url": "https://dribbble.com/shots/...",
    "imageUrl": "https://cdn.dribbble.com/...",
    "description": "Minimal SaaS dashboard with great data visualization",
    "source": "dribbble",
    "platform": "web",
    "category": "dashboard",
    "style": "minimal",
    "tags": ["dashboard", "saas", "data-viz"],
    "liked": true,
    "colorPalette": ["#1e1e2e", "#f43f5e", "#ffffff"],
    "notes": "Love the card layout"
  }'
```
- `title` (required)
- `source`: `dribbble` | `behance` | `awwwards` | `custom` etc.
- `category`: `landing-page` | `dashboard` | `mobile-app` | etc.
- `style`: `minimal` | `bold` | `playful` | `corporate` | etc.

**Update a reference**:
```bash
curl -X PUT http://localhost:3000/api/references/REF_ID \
  -H "Content-Type: application/json" \
  -d '{ "liked": true, "notes": "Updated notes" }'
```

**Delete a reference**:
```bash
curl -X DELETE http://localhost:3000/api/references/REF_ID
```

### Design System

**Get design system**:
```bash
curl http://localhost:3000/api/design-system
```
Response:
```json
{
  "colors": [], "typography": [],
  "spacing": { "base": 8, "scale": [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] },
  "borderRadius": "8px", "shadows": [], "components": [], "principles": [],
  "gridSystem": "12-column",
  "breakpoints": { "sm": 640, "md": 768, "lg": 1024, "xl": 1280 }
}
```

**Update design system**:
```bash
curl -X PUT http://localhost:3000/api/design-system \
  -H "Content-Type: application/json" \
  -d '{
    "colors": [
      { "name": "Primary", "hex": "#f43f5e", "usage": "CTAs, links" },
      { "name": "Background", "hex": "#1e1e2e", "usage": "Page background" }
    ],
    "typography": [
      { "name": "Heading", "family": "Inter", "weight": 700, "sizes": ["32px", "24px", "20px"] }
    ],
    "components": ["Button", "Card", "Input", "Modal"],
    "principles": ["Consistency", "Accessibility", "Simplicity"]
  }'
```

**Extract from Figma** (saves notes, actual extraction via AI + MCP):
```bash
curl -X POST http://localhost:3000/api/design-system/extract \
  -H "Content-Type: application/json" \
  -d '{
    "figmaUrl": "https://www.figma.com/file/...",
    "notes": "Extract colors, typography, and component library"
  }'
```

### Documents (Knowledge Base)

**List documents**:
```bash
curl http://localhost:3000/api/documents
```

**Get document with chunks**:
```bash
curl http://localhost:3000/api/documents/DOC_ID
```

**Upload a document**:
```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@guidelines.pdf" \
  -F "name=Design Guidelines" \
  -F "category=brand-guidelines" \
  -F 'tags=["brand","guidelines"]'
```
Supported: `.pdf`, `.md`, `.txt`, `.html`, `.htm`. Auto-chunks for search.

**Delete a document** (also removes chunks):
```bash
curl -X DELETE http://localhost:3000/api/documents/DOC_ID
```

### Search (BM25)

```bash
curl "http://localhost:3000/api/search?q=button+design+patterns&limit=10"
```
Response: Array of `{ content, score, docName, docCategory, ... }`.

### Reviews

**List reviews** (with filters):
```bash
curl http://localhost:3000/api/reviews
curl "http://localhost:3000/api/reviews?status=open&type=audit"
```

**Create a review**:
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Homepage Redesign Audit",
    "figmaUrl": "https://www.figma.com/file/...",
    "type": "audit",
    "status": "open",
    "findings": [
      { "severity": "high", "description": "Contrast ratio below 4.5:1 on CTAs", "recommendation": "Use #f43f5e on white" }
    ],
    "score": 72
  }'
```
- `title` (required)
- `type`: `audit` | `review` | `feedback`
- `status`: `open` | `in-progress` | `closed`

**Update a review**:
```bash
curl -X PUT http://localhost:3000/api/reviews/REV_ID \
  -H "Content-Type: application/json" \
  -d '{ "status": "closed", "score": 85, "findings": [...] }'
```

**Delete a review**:
```bash
curl -X DELETE http://localhost:3000/api/reviews/REV_ID
```

### Projects

**List projects** (with status filter):
```bash
curl http://localhost:3000/api/projects
curl "http://localhost:3000/api/projects?status=discovery"
```

**Create a project**:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App Redesign",
    "description": "Complete redesign of the mobile experience",
    "figmaUrl": "https://www.figma.com/file/...",
    "status": "discovery",
    "references": ["REF_ID1", "REF_ID2"],
    "reviews": [],
    "notes": "Focus on onboarding flow"
  }'
```
- `name` (required)
- `status`: `discovery` | `wireframing` | `design` | `review` | `handoff` | `complete`

**Update a project**:
```bash
curl -X PUT http://localhost:3000/api/projects/PROJ_ID \
  -H "Content-Type: application/json" \
  -d '{ "status": "design", "notes": "Moving to high-fidelity" }'
```

**Delete a project**:
```bash
curl -X DELETE http://localhost:3000/api/projects/PROJ_ID
```

### Config

**Get config**:
```bash
curl http://localhost:3000/api/config
```
Response: `{ "figmaToken": "", "preferredStyles": [], "brandColors": [], "typographyPreferences": [], "mcpEndpoint": "https://mcp.figma.com/mcp" }`

**Update config**:
```bash
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{ "figmaToken": "your-figma-token", "preferredStyles": ["minimal", "modern"] }'
```

### Analytics

**Get design analytics**:
```bash
curl http://localhost:3000/api/analytics
```
Response:
```json
{
  "references": { "total": 25, "liked": 10 },
  "reviews": { "total": 8, "byStatus": { "open": 3, "closed": 5 }, "avgScore": 78 },
  "projects": { "total": 4, "byStatus": { "discovery": 1, "design": 2, "complete": 1 } },
  "documents": { "total": 5 },
  "stylePreferences": { "styles": { "minimal": 5 }, "categories": { "dashboard": 3 } }
}
```
