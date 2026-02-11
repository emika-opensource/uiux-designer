# AUDIT — UI/UX Designer AI Employee

**Date:** 2026-02-11
**Auditor:** Automated internal audit
**Verdict:** Solid foundation, but first-run experience is an empty void. New users hit a wall of zeros.

---

## 1. First-Run Experience

**Rating: 2/10 — Terrible**

When a new user opens the dashboard for the first time, they see:

- **5 stat cards all showing "0"** — References: 0, Liked: 0, Reviews: 0, Projects: 0, Documents: 0
- **3 action buttons** (Add Reference, Start Review, New Project) — but no guidance on *why* or *which to click first*
- **No onboarding wizard, no welcome message, no tutorial, no sample data**
- **No explanation of what this tool does or how the AI connects to it**

**Steps to first value:** A user must:
1. Understand what "references" means in this context (no explanation)
2. Click "Add Reference" → fill a 10-field form → save
3. Realize they should also set up Figma token in Settings
4. Upload documents to Knowledge Base
5. Create a project

That's **5+ steps with zero guidance**. Most users will bounce after seeing all zeros.

**The BOOTSTRAP.md exists but it's for the AI agent, not the user.** The AI asks 8 onboarding questions, but nothing in the UI surfaces this. The dashboard doesn't know if onboarding happened.

---

## 2. UI/UX Issues

### Critical
- **No loading states anywhere.** Every `render*()` function does `await api(...)` then sets innerHTML. During fetch, the user sees stale content or nothing. No skeleton screens, no spinners.
- **No error handling in UI.** If any API call fails, the app silently breaks. `api()` calls `.json()` unconditionally — if the server returns 500, it'll throw and the page goes blank.
- **Reference cards show gradient backgrounds instead of actual images.** The `imageUrl` field is collected but never rendered — cards show a colored gradient with a style label. This makes the "reference library" nearly useless for visual inspiration.

### Major
- **Moodboard view only shows liked references**, but the filter bar still shows. If user clicks "Moodboard" with no liked items, they get an empty state inside the gallery area — confusing.
- **Edit Review modal doesn't pre-populate current values.** `openEditReview()` reads from `state.reviews` which is never populated (state is initialized as `[]` and never updated by the review fetch). The status dropdown defaults to first option, not current.
- **Edit Project modal also doesn't pre-populate.** Same issue — notes field is always empty.
- **No confirmation feedback for Figma extraction.** The extract endpoint is a placeholder that just saves notes. User thinks extraction happened.
- **`marked` dependency is imported but never used.** Dead code.
- **Filter pills only show first 6 categories.** The remaining 8 categories are hidden with no way to access them.

### Minor
- **Toast notifications stack.** Multiple rapid actions overlap toasts in the same position.
- **No keyboard shortcuts or accessibility.** No ARIA labels, no skip-nav, no focus management in modals.
- **Sidebar doesn't indicate current section clearly on mobile** (60px collapsed mode loses all text).
- **Search in references requires pressing Enter** — no debounce, no search-as-you-type.
- **No pagination.** If someone adds 500 references, all render at once.

---

## 3. Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| References CRUD | ✅ Complete | Works but images not displayed |
| References filtering | ⚠️ Partial | Only 6/14 categories in filter pills |
| Moodboard view | ⚠️ Partial | Just liked refs in bigger cards, not a real moodboard |
| Design System | ✅ Complete | All CRUD works for colors, typography, components, principles |
| Figma extraction | ❌ Stub | Endpoint just saves notes, no actual extraction |
| Knowledge Base upload | ✅ Complete | PDF/text extraction and BM25 chunking works |
| Knowledge Base search | ✅ Complete | BM25 search functional |
| Reviews CRUD | ✅ Complete | Including findings |
| Projects CRUD | ✅ Complete | Status pipeline visualization works |
| Settings | ✅ Complete | Token storage works |
| Analytics | ✅ Complete | Aggregation works |

**TODOs/Placeholders found:**
- `POST /api/design-system/extract` — comment says "Placeholder — extraction would use Figma API with stored token"
- No actual Figma API calls anywhere in server.js despite extensive docs about it

---

## 4. Error Handling

**Rating: 2/10**

- **Server:** Only the document upload endpoint has try/catch. All other routes will crash on unexpected input (e.g., malformed JSON body, missing fields).
- **Client:** Zero error handling. The `api()` helper doesn't check `res.ok`. Any non-200 response will either throw or produce garbage.
- **Empty states:** Exist for References, Reviews, Projects, and Documents pages — these are decent.
- **Loading states:** None. Zero. Nada.
- **No input validation:** Server accepts any data. No title length limits, no URL validation, no hex color validation. You can save a color with hex value "banana".
- **File upload:** No file type validation on server side beyond the PDF text extraction fallback. Users could upload .exe files.

---

## 5. Code Quality

### Bugs
- **`openEditReview()` reads `state.reviews`** which is always `[]` — the state object is initialized but never written to after API calls. All render functions fetch directly and write to innerHTML, bypassing state.
- **Race conditions:** Multiple rapid clicks trigger parallel API calls and renders. No request cancellation or debouncing.
- **`refFilters.liked` param:** Dashboard calls `api('/api/references?liked=false')` which passes `liked=false` as a string, but the server checks `liked === 'true'`. This works by accident (returns all refs), but is misleading.

### Anti-patterns
- **Reading entire JSON files from disk on every request.** No caching, no in-memory store. With 1000 references, every request reads and parses the full file.
- **Full file rewrite on every mutation.** Concurrent writes could corrupt JSON files.
- **Massive monolithic `app.js`** (920 lines) with all pages, modals, and logic in one file. No components, no templating.
- **innerHTML for everything** — XSS risk if `esc()` is ever missed. Several places use `esc()` correctly, but the pattern is fragile.
- **Global functions everywhere** — `openAddReference`, `toggleLike`, etc. are all on window scope.

### Security
- **Figma token stored in plain JSON file on disk.** Visible to any process. The password input type helps in the UI but the storage is unprotected.
- **No rate limiting.** No auth. Anyone with network access can read/write all data.
- **File upload has no mimetype validation.** Only size limit (50MB, which is generous).
- **No CSRF protection.**

---

## 6. BOOTSTRAP.md Quality

**Rating: 6/10 — Decent but disconnected**

**Strengths:**
- Asks the right questions (product, existing designs, style preference, Figma token, target users)
- Clear post-onboarding action plan (connect Figma, upload guidelines, save references, etc.)
- Good style options with descriptions

**Weaknesses:**
- **8 questions is too many for first interaction.** Users want to DO something, not answer an interview.
- **No connection to the UI.** The dashboard has no onboarding state. After the AI asks these questions via chat, the user still sees all zeros in the dashboard.
- **No progressive disclosure.** Could start with 2-3 questions and ask the rest contextually.
- **The "After Onboarding" section promises things the system can't deliver** (e.g., "Extract design system — Pull colors, fonts, and spacing from your Figma files" — the extract endpoint is a stub).

---

## 7. SKILL.md Quality

**Rating: 8/10 — Comprehensive**

**Strengths:**
- Excellent design knowledge base (hierarchy, typography, color theory, layout, accessibility, micro-interactions)
- Well-structured review methodology with weighted scoring
- Good API documentation integrated into the skill
- Clear guidance on working with users and checking preferences
- MCP integration documented with fallback REST API

**Weaknesses:**
- **Assumes Figma MCP actually works** — it requires the user to set the token in env vars, but the SKILL tells the AI to use stored config token. These are different mechanisms.
- **No guidance on what to do when the dashboard is empty.** Should tell the AI to proactively populate sample data or guide the user.
- **No error recovery instructions.** What if MCP fails? What if the API is down?

---

## 8. Specific Improvements (Ranked by Impact)

### 🔴 Critical (Do these first)

1. **Add a first-run welcome screen.** Detect empty state (all counts = 0) and show a guided setup wizard instead of the empty dashboard. "Let's set up your design workspace in 3 steps: 1) Add your Figma token, 2) Save your first reference, 3) Upload brand guidelines." This alone could 5x activation.

2. **Add loading and error states.** Wrap `api()` with proper error handling. Show skeleton loaders during fetch. Show error toasts on failure. This prevents the "blank screen of death."

3. **Render actual reference images.** The `imageUrl` field is collected but never displayed. Show the image in `ref-preview` instead of a gradient. Fall back to gradient only when no image exists. This makes the reference library actually useful.

4. **Add seed/sample data option.** On first run, offer "Load example workspace" that populates 5-10 references, a sample design system, and a sample project. Users learn by seeing, not by reading.

### 🟡 Important

5. **Reduce BOOTSTRAP.md to 3 questions max.** Ask: (a) What's your product? (b) Share a Figma link or reference URL. (c) What style do you prefer? Everything else can be asked later contextually.

6. **Fix the edit modals bug.** `openEditReview()` and `openEditProject()` need to fetch the current item and pre-populate fields. Currently they show empty/default values.

7. **Add client-side error handling.** Make `api()` check `res.ok` and show toast on failure. Wrap render functions in try/catch.

8. **Implement actual Figma token flow.** Store the token from Settings in config, and have the AI use it for REST API calls. The MCP integration is separate — at minimum the REST fallback should work.

9. **Add input validation.** Server-side: validate required fields, URL formats, hex colors. Client-side: disable submit buttons when required fields are empty.

10. **Split app.js into modules.** Use ES modules or at least separate files per page. 920 lines of global functions is unmaintainable.

### 🟢 Nice to Have

11. **Add drag-and-drop for reference image upload.** Let users drop screenshots directly onto reference cards instead of requiring hosted image URLs.

12. **Add real-time preview for color inputs.** Show a swatch next to the hex input that updates as you type.

13. **Add pagination or virtual scrolling** for references list.

14. **Add keyboard shortcuts.** `N` for new, `/` for search, `Esc` to close modals.

15. **Add ARIA labels and focus management** in modals for accessibility.

16. **Add a "Quick Add" reference flow** — just paste a URL, auto-extract title/image via og:tags on the server side. One-click reference saving.

17. **Remove unused `marked` dependency** from package.json.

18. **Add file write locking or use SQLite** instead of JSON files to prevent corruption under concurrent writes.

---

## Summary

| Area | Score | Notes |
|------|-------|-------|
| First-Run Experience | 2/10 | Empty void, no onboarding in UI |
| UI/UX Quality | 5/10 | Beautiful dark theme, but missing critical feedback patterns |
| Feature Completeness | 6/10 | Core CRUD works, Figma integration is a stub |
| Error Handling | 2/10 | Almost nonexistent |
| Code Quality | 4/10 | Monolithic, no validation, race conditions |
| BOOTSTRAP.md | 6/10 | Good questions, too many, disconnected from UI |
| SKILL.md | 8/10 | Comprehensive and well-structured |
| **Overall** | **4.5/10** | |

**The #1 problem is the empty first-run screen.** A new user opens this and sees five zeros with no guidance. The AI's onboarding happens in chat but the dashboard doesn't reflect it. Fix the first-run experience and this product's perceived quality jumps from "broken" to "polished" overnight.

---

## Fixes Applied

**Date:** 2026-02-11

### 🔴 Critical Fixes

1. **✅ First-run welcome wizard added.** Dashboard detects empty state (all counts = 0 and `onboardingDone` not set in config). Shows a 3-step guided wizard: connect Figma token, save first reference, or load sample data. Wizard state persists via `config.onboardingDone` flag. Sample data loader creates 5 references (with real Unsplash image URLs), a full design system (6 colors, 4 type styles, 3 components, 5 principles), and a sample project.

2. **✅ Loading and error states added everywhere.** Every render function now shows a spinner during fetch and an error state with retry button on failure. `showLoading()` and `showError()` helpers added. CSS includes `.loading-state`, `.spinner` with animation.

3. **✅ Reference images now render.** `refCard()` and `renderRefDetail()` now display actual `<img>` tags from `imageUrl` with `onerror` fallback to the gradient. New CSS classes `.ref-preview-img` and `.ref-preview-fallback` handle layout.

4. **✅ Client-side error handling added.** `api()` now checks `res.ok` and throws on non-2xx responses. Every `save*`, `update*`, `delete*`, and `upload*` function wrapped in try/catch with error toasts. Form validation added (required title/name fields).

### 🟡 Important Fixes

5. **✅ BOOTSTRAP.md compressed to 3 questions.** Reduced from 8 questions to 3 (product, reference, style). Removed interview-style format. Added note that additional context is asked contextually.

6. **✅ Edit Review modal pre-populates values.** `openEditReview()` now fetches the review by ID from the API and pre-populates title, status (with correct `selected` attribute), score, and Figma URL. No longer reads from stale `state.reviews`.

7. **✅ Edit Project modal pre-populates values.** `openEditProject()` now fetches the project by ID and pre-populates name, description, status, Figma URL, and notes. All fields editable (was previously only status + notes).

8. **✅ Figma extraction clearly marked as "Coming Soon".** Modal now shows a `.coming-soon-badge`, explains that extraction requires the AI agent via MCP, and button relabeled to "Save Notes" with appropriate toast message. Server comment updated.

9. **✅ `state.reviews` and `state.projects` now populated.** `renderReviews()`, `renderReviewDetail()`, `renderProjects()`, `renderProjectDetail()` all update `state.reviews`/`state.projects` after fetching.

10. **✅ BOOTSTRAP.md connected to UI onboarding.** Welcome wizard step 1 saves Figma token to config (same as Settings page). Step 2 saves a reference. Config stores `onboardingDone` flag to prevent re-showing wizard.

### 🟢 Additional Fixes

11. **✅ Filter pills show all categories.** Added "+N more" pill that expands to show all 14 categories, with "Show less" to collapse.

12. **✅ Toast stacking fixed.** Only one toast visible at a time — previous toast removed before showing new one.

13. **✅ Moodboard empty state improved.** When no liked references exist in moodboard view, shows clear message with button to switch to gallery view instead of confusing empty space.

14. **✅ Search-as-you-type with debounce.** References search now triggers after 300ms of inactivity (debounced), no longer requires Enter key.

15. **✅ Removed unused `marked` dependency.** Removed from both `server.js` import and `package.json`.

16. **✅ Server-side input validation added.** Required field validation for references (title), reviews (title), projects (name). URL validation helper. Hex color validation in client-side color modals. File upload type validation (only PDF/MD/TXT/HTML allowed).

17. **✅ Color preview swatch in Add/Edit Color modals.** Live-updating color preview next to hex input field.

18. **✅ Modal focus management.** First input in modal auto-focused on open.

19. **✅ Knowledge base search shows loading spinner.** Search results area shows spinner during fetch.

### Not Fixed (Out of Scope / Requires Architecture Changes)

- **Splitting app.js into modules** — Would require build tooling setup (bundler/ESM). Deferred.
- **SQLite/file locking** — Requires architecture change. JSON files adequate for single-user use.
- **Rate limiting / auth** — Security hardening for multi-user deployment. Out of scope for single-user AI employee.
- **ARIA labels / full accessibility** — Incremental improvement, not blocking.
- **Pagination / virtual scroll** — Performance optimization for large datasets. Deferred.
