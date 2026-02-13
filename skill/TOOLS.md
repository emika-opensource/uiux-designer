# Design Studio — API Reference

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.

## ⚠️ IMPORTANT: Port 3000

Your **Design Studio** web application is ALREADY RUNNING on port 3000. It starts automatically via start.sh.

- **DO NOT** kill anything on port 3000 — that is YOUR app
- **DO NOT** try to start a new server on port 3000
- The app is accessible to the user via the browser panel (iframe)
- If you need to build something for the user, deploy it on a DIFFERENT port using PM2


Base URL: `{{base_url}}`

## References
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/references` | List references. Query: `?category=&style=&platform=&liked=true&source=&search=` |
| GET | `/api/references/liked` | Get liked references only |
| GET | `/api/references/styles` | Aggregated style preferences from liked refs |
| POST | `/api/references` | Create reference. Body: `{ title, url, imageUrl, description, source, platform, category, tags[], liked, style, colorPalette[], notes }` |
| PUT | `/api/references/:id` | Update reference |
| DELETE | `/api/references/:id` | Delete reference |

Sources: dribbble, behance, pinterest, figma, custom
Platforms: web, mobile, desktop, tablet
Categories: landing-page, dashboard, form, navigation, card, modal, onboarding, pricing, settings, profile, ecommerce, blog, saas, mobile-app
Styles: minimal, bold, playful, corporate, luxury, organic, geometric, brutalist

## Design System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/design-system` | Get design system |
| PUT | `/api/design-system` | Update design system. Body: `{ colors[], typography[], spacing, borderRadius, shadows[], components[], principles[], gridSystem, breakpoints }` |
| POST | `/api/design-system/extract` | Extract from Figma. Body: `{ figmaUrl, notes }` |

## Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get document with chunks |
| POST | `/api/documents` | Upload doc (multipart: file, name, category, tags) |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/search?q=query&limit=10` | BM25 search |

Categories: brand-guidelines, style-guide, design-system, wireframes, research, accessibility

## Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | List reviews. Query: `?status=&type=` |
| POST | `/api/reviews` | Create review. Body: `{ title, figmaUrl, type, findings[], score }` |
| PUT | `/api/reviews/:id` | Update review |
| DELETE | `/api/reviews/:id` | Delete review |

Finding schema: `{ element, issue, severity, recommendation, category }`
Severities: critical, major, minor, suggestion
Categories: accessibility, consistency, usability, visual, performance

## Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects. Query: `?status=` |
| POST | `/api/projects` | Create project. Body: `{ name, description, figmaUrl, status, references[], reviews[], notes }` |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

Statuses: discovery, wireframing, visual-design, prototyping, handoff, complete

## Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get settings |
| PUT | `/api/config` | Update settings. Body: `{ figmaToken, mcpEndpoint, preferredStyles[], brandColors[], typographyPreferences[] }` |

## Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Design workspace stats |

## Screenshots & File Sharing

### Taking Screenshots
Use Playwright (pre-installed) to capture any website:
```bash
npx playwright screenshot --browser chromium https://example.com /tmp/screenshot.png
```

If Chromium is not installed yet, install it first:
```bash
npx playwright install chromium
```

### Sharing Files & Images with the User
Upload to the Emika API to get a shareable URL:
```bash
# Get your seat token

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.
TOKEN=$(python3 -c "import json; print(json.load(open('/home/node/.openclaw/openclaw.json'))['gateway']['auth']['token'])")

# Upload any file

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.
URL=$(curl -s -X POST "http://162.55.102.58:8080/uploads/seat" \
  -H "X-Seat-Token: $TOKEN" \
  -F "file=@/tmp/screenshot.png" | python3 -c "import sys,json; print(json.load(sys.stdin)['full_url'])")

# Include the URL in your response as markdown image

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.
echo "![Screenshot]($URL)"
```

**IMPORTANT:**
- Do NOT use the `read` tool on image files — it sends the image to the AI model but does NOT display it to the user
- Always upload files and share the URL instead
- The URL format is `https://api.emika.ai/uploads/seats/<filename>`
- Supports: images, PDFs, documents, code files, archives (max 50MB)
