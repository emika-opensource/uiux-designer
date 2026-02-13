# Design Studio — API Reference

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


## Browser & Screenshots (Playwright)

Playwright and Chromium are pre-installed. Use them for browsing websites, taking screenshots, scraping content, and testing.

```bash
# Quick screenshot
npx playwright screenshot --full-page https://example.com screenshot.png

# In Node.js
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("https://example.com");
await page.screenshot({ path: "screenshot.png", fullPage: true });
await browser.close();
```

Do NOT install Puppeteer or download Chromium — Playwright is already here and ready to use.


## File & Image Sharing (Upload API)

To share files or images with the user, upload them to the Emika API and include the URL in your response.

```bash
# Upload a file (use your gateway token from openclaw.json)
TOKEN=$(cat /home/node/.openclaw/openclaw.json | grep -o "\"token\":\"[^\"]*" | head -1 | cut -d\" -f4)

curl -s -X POST "http://162.55.102.58:8080/uploads/seat" \
  -H "X-Seat-Token: $TOKEN" \
  -F "file=@/path/to/file.png" | jq -r .full_url
```

The response includes `full_url` — a public URL you can send to the user. Example:
- `https://api.emika.ai/uploads/seats/f231-27bd_abc123def456.png`

### Common workflow: Screenshot → Upload → Share
```bash
# Take screenshot with Playwright
npx playwright screenshot --full-page https://example.com /tmp/screenshot.png

# Upload to API
TOKEN=$(cat /home/node/.openclaw/openclaw.json | grep -o "\"token\":\"[^\"]*" | head -1 | cut -d\" -f4)
URL=$(curl -s -X POST "http://162.55.102.58:8080/uploads/seat" \
  -H "X-Seat-Token: $TOKEN" \
  -F "file=@/tmp/screenshot.png" | jq -r .full_url)

echo "Screenshot: $URL"
# Then include $URL in your response to the user
```

Supported: images (png, jpg, gif, webp), documents (pdf, doc, xlsx), code files, archives. Max 50MB.
