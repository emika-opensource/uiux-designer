/* ============ Design Studio — Frontend App ============ */
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];
const main = () => $('#mainContent');
const API = '';

// ============ State ============
let state = { page: 'dashboard', references: [], reviews: [], projects: [], documents: [], designSystem: null, analytics: null, config: null };

// ============ Router ============
function navigate(page) {
  state.page = page;
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  render();
}

window.addEventListener('hashchange', () => navigate(location.hash.slice(1) || 'dashboard'));
window.addEventListener('load', () => navigate(location.hash.slice(1) || 'dashboard'));

// ============ API Helpers ============
async function api(url, opts) {
  const res = await fetch(API + url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}
async function apiPost(url, data) { return api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
async function apiPut(url, data) { return api(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
async function apiDel(url) { return api(url, { method: 'DELETE' }); }

// ============ Toast ============
let toastTimer = null;
let toastEl = null;
function toast(msg, type = 'success') {
  if (toastEl) toastEl.remove();
  toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  toastEl.textContent = msg;
  document.body.appendChild(toastEl);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (toastEl) { toastEl.remove(); toastEl = null; } }, 3000);
}

// ============ Loading / Error helpers ============
function showLoading(container) {
  if (!container) return;
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>`;
}

function showError(container, msg) {
  if (!container) return;
  container.innerHTML = `<div class="empty-state"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--red)" stroke-width="1.5"><circle cx="16" cy="16" r="14"/><line x1="16" y1="10" x2="16" y2="18"/><circle cx="16" cy="22" r="1" fill="var(--red)"/></svg><h3>Something went wrong</h3><p>${esc(msg)}</p><button class="btn btn-secondary" onclick="render()">Retry</button></div>`;
}

// ============ Modal ============
function openModal(html) {
  const overlay = $('#modalOverlay');
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.classList.add('open');
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  // Focus first input
  const first = overlay.querySelector('input,textarea,select');
  if (first) setTimeout(() => first.focus(), 50);
}
function closeModal() { $('#modalOverlay').classList.remove('open'); $('#modalOverlay').innerHTML = ''; }

// ============ Render Router ============
async function render() {
  const p = state.page;
  if (p === 'dashboard') await renderDashboard();
  else if (p === 'references') await renderReferences();
  else if (p === 'design-system') await renderDesignSystem();
  else if (p === 'knowledge') await renderKnowledge();
  else if (p === 'reviews') await renderReviews();
  else if (p === 'projects') await renderProjects();
  else if (p === 'settings') await renderSettings();
  else await renderDashboard();
}

// ============ SVG Icons ============
const icons = {
  heart: (filled) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="${filled ? '#fff' : 'none'}" stroke="${filled ? 'none' : 'currentColor'}" stroke-width="1.5"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>`,
  plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="8" x2="4" y2="8"/><polyline points="8,4 4,8 8,12"/></svg>',
  upload: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 20V8M16 8l-4 4M16 8l4 4"/><path d="M6 22v2a2 2 0 002 2h16a2 2 0 002-2v-2"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4v7a2 2 0 01-2 2H5a2 2 0 01-2-2V4"/></svg>',
  figma: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="1" width="4" height="4" rx="2"/><rect x="7" y="1" width="4" height="4" rx="2"/><rect x="3" y="5" width="4" height="4" rx="2"/><circle cx="9" cy="7" r="2"/><rect x="3" y="9" width="4" height="4" rx="2"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 2l3 3-7 7H2v-3l7-7z"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,7 6,10 11,4"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 8a3 3 0 004 0l2-2a3 3 0 00-4-4L7 3"/><path d="M8 6a3 3 0 00-4 0L2 8a3 3 0 004 4l1-1"/></svg>',
  rocket: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4c-4 4-6 10-6 16h12c0-6-2-12-6-16z"/><circle cx="16" cy="14" r="2"/><path d="M10 20c-2 0-4 2-4 4h4"/><path d="M22 20c2 0 4 2 4 4h-4"/></svg>',
  palette: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="8"/><circle cx="10" cy="6" r="1.5" fill="var(--accent)"/><circle cx="6" cy="10" r="1.5" fill="var(--blue)"/><circle cx="13" cy="12" r="1.5" fill="var(--green)"/></svg>',
  image: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="16" height="14" rx="2"/><circle cx="7" cy="8" r="2"/><path d="M2 14l4-4 3 3 4-5 5 6"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4a2 2 0 012-2h4l2 2h4a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"/></svg>',
};

// ============ Color Helpers ============
const styleColors = {
  minimal: ['#f8f9fa','#e9ecef','#dee2e6','#ced4da'],
  bold: ['#ef4444','#f97316','#eab308','#22c55e'],
  playful: ['#ec4899','#8b5cf6','#06b6d4','#f59e0b'],
  corporate: ['#1e3a5f','#2563eb','#6b7280','#f3f4f6'],
  luxury: ['#1a1a2e','#c9a227','#2d2d44','#e8e0d0'],
  organic: ['#4ade80','#84cc16','#a3e635','#fbbf24'],
  geometric: ['#6366f1','#ec4899','#14b8a6','#f97316'],
  brutalist: ['#000000','#ff0000','#ffffff','#ffff00'],
};

function styleGradient(style) {
  const c = styleColors[style] || styleColors.minimal;
  return `linear-gradient(135deg, ${c[0]}, ${c[1]}, ${c[2]})`;
}

function scoreClass(s) { return s > 80 ? 'score-good' : s > 50 ? 'score-ok' : 'score-bad'; }

const CATEGORIES = ['landing-page','dashboard','form','navigation','card','modal','onboarding','pricing','settings','profile','ecommerce','blog','saas','mobile-app'];
const STYLES = ['minimal','bold','playful','corporate','luxury','organic','geometric','brutalist'];
const PLATFORMS = ['web','mobile','desktop','tablet'];
const SOURCES = ['dribbble','behance','pinterest','figma','custom'];
const REVIEW_TYPES = ['audit','feedback','suggestion','improvement'];
const REVIEW_STATUSES = ['open','in-progress','addressed','deferred'];
const PROJECT_STATUSES = ['discovery','wireframing','visual-design','prototyping','handoff','complete'];
const DOC_CATEGORIES = ['brand-guidelines','style-guide','design-system','wireframes','research','accessibility'];
const SEVERITIES = ['critical','major','minor','suggestion'];
const FINDING_CATS = ['accessibility','consistency','usability','visual','performance'];

// ============ WELCOME WIZARD ============
async function checkFirstRun(analytics) {
  const total = (analytics.references?.total || 0) + (analytics.reviews?.total || 0) + (analytics.projects?.total || 0) + (analytics.documents?.total || 0);
  return total === 0;
}

function renderWelcomeWizard() {
  main().innerHTML = `
    <div class="welcome-wizard">
      <div class="welcome-header">
        <div class="welcome-icon">${icons.rocket}</div>
        <h1 class="page-title" style="font-size:28px">Welcome to Design Studio</h1>
        <p class="page-subtitle" style="margin-bottom:8px">Your AI-powered design workspace. Let's get you set up in 3 quick steps.</p>
      </div>
      <div class="wizard-steps">
        <div class="wizard-step" id="wizStep1">
          <div class="wizard-step-num">1</div>
          <div class="wizard-step-content">
            <h3>Connect Figma <span class="wizard-optional">(optional)</span></h3>
            <p>Paste your Figma Personal Access Token so the AI can read and work in your design files.</p>
            <div class="form-group" style="margin-top:12px;margin-bottom:0">
              <input class="full" id="wizFigmaToken" type="password" placeholder="figd_...">
              <p style="font-size:11px;color:var(--text-dim);margin-top:4px">Figma → Settings → Personal Access Tokens</p>
            </div>
          </div>
        </div>
        <div class="wizard-step" id="wizStep2">
          <div class="wizard-step-num">2</div>
          <div class="wizard-step-content">
            <h3>Save your first reference</h3>
            <p>Add a website or design you love. This helps the AI learn your taste.</p>
            <div style="margin-top:12px">
              <div class="form-group"><input class="full" id="wizRefTitle" placeholder="e.g. Stripe Dashboard"></div>
              <div class="form-row">
                <div class="form-group"><input class="full" id="wizRefUrl" placeholder="URL (https://...)"></div>
                <div class="form-group"><input class="full" id="wizRefImg" placeholder="Screenshot URL (optional)"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><select class="full" id="wizRefStyle">${STYLES.map(s=>`<option>${s}</option>`).join('')}</select></div>
                <div class="form-group"><select class="full" id="wizRefCat">${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
              </div>
            </div>
          </div>
        </div>
        <div class="wizard-step" id="wizStep3">
          <div class="wizard-step-num">3</div>
          <div class="wizard-step-content">
            <h3>Or load example data</h3>
            <p>Don't have anything ready? Load a sample workspace with references, a design system, and a project to explore.</p>
            <button class="btn btn-secondary" onclick="loadSampleData()" id="wizSampleBtn" style="margin-top:12px">${icons.palette} Load Example Workspace</button>
            <span id="wizSampleStatus" style="margin-left:8px;font-size:12px;color:var(--green);display:none">✓ Loaded!</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:32px">
        <button class="btn btn-secondary" onclick="skipWizard()">Skip for now</button>
        <button class="btn btn-primary" onclick="completeWizard()" style="padding:10px 28px">Get Started →</button>
      </div>
    </div>
  `;
}

async function loadSampleData() {
  const btn = $('#wizSampleBtn');
  if (btn) btn.disabled = true;
  try {
    // Sample references
    const sampleRefs = [
      { title: 'Stripe Dashboard', url: 'https://stripe.com', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', description: 'Clean financial dashboard with excellent data visualization', source: 'custom', platform: 'web', category: 'dashboard', style: 'minimal', tags: ['clean','data','fintech'], colorPalette: ['#635bff','#0a2540','#00d4aa'], liked: true },
      { title: 'Linear App', url: 'https://linear.app', imageUrl: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=600', description: 'Fast, beautiful project management with dark mode', source: 'custom', platform: 'web', category: 'saas', style: 'minimal', tags: ['dark','fast','productivity'], colorPalette: ['#5e6ad2','#1a1a2e','#ffffff'], liked: true },
      { title: 'Vercel Homepage', url: 'https://vercel.com', imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600', description: 'Bold hero sections with gradient text effects', source: 'custom', platform: 'web', category: 'landing-page', style: 'bold', tags: ['gradient','developer','modern'], colorPalette: ['#000000','#ffffff','#0070f3'], liked: true },
      { title: 'Notion', url: 'https://notion.so', imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600', description: 'Flexible workspace with clean typography', source: 'custom', platform: 'web', category: 'saas', style: 'minimal', tags: ['productivity','clean','flexible'], liked: false },
      { title: 'Figma Community', url: 'https://figma.com/community', imageUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600', description: 'Playful card layouts with vibrant colors', source: 'figma', platform: 'web', category: 'ecommerce', style: 'playful', tags: ['cards','community','colorful'], liked: false },
    ];
    for (const ref of sampleRefs) await apiPost('/api/references', ref);

    // Sample design system
    await apiPut('/api/design-system', {
      colors: [
        { name: 'Primary', hex: '#ec4899', usage: 'Buttons, links, accents' },
        { name: 'Background', hex: '#06060a', usage: 'Page background' },
        { name: 'Surface', hex: '#0d0d14', usage: 'Cards, panels' },
        { name: 'Success', hex: '#22c55e', usage: 'Success states' },
        { name: 'Warning', hex: '#eab308', usage: 'Warning states' },
        { name: 'Error', hex: '#ef4444', usage: 'Error states' },
      ],
      typography: [
        { name: 'Display', family: 'DM Sans', weight: '700', size: '32px', usage: 'Page titles' },
        { name: 'Heading', family: 'DM Sans', weight: '600', size: '20px', usage: 'Section headings' },
        { name: 'Body', family: 'DM Sans', weight: '400', size: '14px', usage: 'Body text' },
        { name: 'Caption', family: 'DM Sans', weight: '500', size: '12px', usage: 'Labels, metadata' },
      ],
      spacing: { base: 8, scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] },
      borderRadius: '10px',
      shadows: [],
      components: [
        { name: 'Button', description: 'Primary action trigger with hover glow effect', variants: ['primary','secondary','ghost','danger'], figmaLink: '' },
        { name: 'Card', description: 'Content container with border and hover state', variants: ['default','interactive','stat'], figmaLink: '' },
        { name: 'Badge', description: 'Small status or category label', variants: ['source','category','style','platform','severity'], figmaLink: '' },
      ],
      principles: ['Clarity over cleverness','Generous whitespace','Consistent 8px grid','Dark-first, light-friendly','Motion with purpose'],
      gridSystem: '12-column',
      breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
    });

    // Sample project
    await apiPost('/api/projects', { name: 'Website Redesign', description: 'Complete redesign of the marketing website with modern design system', figmaUrl: '', status: 'discovery', notes: 'Focus on conversion optimization and mobile-first approach' });

    const status = $('#wizSampleStatus');
    if (status) status.style.display = 'inline';
    if (btn) btn.textContent = '✓ Loaded!';
    toast('Sample workspace loaded!');
  } catch (e) {
    toast('Failed to load samples: ' + e.message, 'error');
    if (btn) btn.disabled = false;
  }
}

async function completeWizard() {
  try {
    // Save Figma token if provided
    const token = $('#wizFigmaToken')?.value;
    if (token) {
      await apiPut('/api/config', { figmaToken: token });
    }
    // Save reference if title provided
    const title = $('#wizRefTitle')?.value;
    if (title) {
      await apiPost('/api/references', {
        title,
        url: $('#wizRefUrl')?.value || '',
        imageUrl: $('#wizRefImg')?.value || '',
        style: $('#wizRefStyle')?.value || 'minimal',
        category: $('#wizRefCat')?.value || 'landing-page',
        source: 'custom', platform: 'web', liked: true, tags: [], colorPalette: [],
      });
    }
    // Mark onboarding done
    const config = await api('/api/config');
    await apiPut('/api/config', { ...config, onboardingDone: true });
    toast('Welcome to Design Studio!');
    render();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function skipWizard() {
  try {
    const config = await api('/api/config');
    await apiPut('/api/config', { ...config, onboardingDone: true });
  } catch(e) { /* ignore */ }
  render();
}

// ============ DASHBOARD ============
async function renderDashboard() {
  showLoading(main());
  try {
    const [analytics, refs, reviews] = await Promise.all([
      api('/api/analytics'),
      api('/api/references'),
      api('/api/reviews')
    ]);

    // Check if first run — show wizard
    const config = await api('/api/config');
    const isFirstRun = await checkFirstRun(analytics);
    if (isFirstRun && !config.onboardingDone) {
      return renderWelcomeWizard();
    }

    const recentRefs = refs.slice(0, 4);
    const recentReviews = reviews.slice(0, 3);
    const topStyles = Object.entries(analytics.stylePreferences?.styles || {}).sort((a,b) => b[1]-a[1]).slice(0,3);

    main().innerHTML = `
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Your design workspace at a glance</p>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value stat-accent">${analytics.references?.total || 0}</div><div class="stat-label">References</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent)">${analytics.references?.liked || 0}</div><div class="stat-label">Liked</div></div>
        <div class="stat-card"><div class="stat-value">${analytics.reviews?.total || 0}</div><div class="stat-label">Reviews</div></div>
        <div class="stat-card"><div class="stat-value">${analytics.projects?.total || 0}</div><div class="stat-label">Projects</div></div>
        <div class="stat-card"><div class="stat-value">${analytics.documents?.total || 0}</div><div class="stat-label">Documents</div></div>
      </div>
      ${topStyles.length ? `<div class="section-title">Style Preferences</div><div class="swatch-row" style="margin-bottom:24px">${topStyles.map(([s,c]) => `<div class="pill active">${s} (${c})</div>`).join('')}</div>` : ''}
      <div style="display:flex;gap:10px;margin-bottom:28px">
        <button class="btn btn-primary" onclick="openAddReference()">${icons.plus} Add Reference</button>
        <button class="btn btn-secondary" onclick="openAddReview()">${icons.plus} Start Review</button>
        <button class="btn btn-secondary" onclick="openAddProject()">${icons.plus} New Project</button>
      </div>
      ${recentRefs.length ? `<div class="section-title">Recent References</div><div class="ref-gallery">${recentRefs.map(refCard).join('')}</div>` : ''}
      ${recentReviews.length ? `<div class="section-title" style="margin-top:28px">Recent Reviews</div>${recentReviews.map(reviewCard).join('')}` : ''}
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

// ============ REFERENCES ============
let refFilters = { category: '', style: '', platform: '', liked: false, search: '' };
let refView = 'gallery';
let refDetail = null;
let showAllCategories = false;

async function renderReferences() {
  if (refDetail) return renderRefDetail();
  showLoading(main());
  try {
    const params = new URLSearchParams();
    if (refFilters.category) params.set('category', refFilters.category);
    if (refFilters.style) params.set('style', refFilters.style);
    if (refFilters.platform) params.set('platform', refFilters.platform);
    if (refFilters.liked) params.set('liked', 'true');
    if (refFilters.search) params.set('search', refFilters.search);
    const refs = await api('/api/references?' + params);

    const visibleCats = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 6);
    const hiddenCount = CATEGORIES.length - 6;

    main().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1 class="page-title">References</h1><p class="page-subtitle">Your design inspiration library</p></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost ${refView==='gallery'?'':'btn-secondary'}" onclick="refView='gallery';renderReferences()" style="${refView==='gallery'?'color:var(--accent)':''}">Gallery</button>
          <button class="btn btn-ghost ${refView==='moodboard'?'':'btn-secondary'}" onclick="refView='moodboard';renderReferences()" style="${refView==='moodboard'?'color:var(--accent)':''}">Moodboard</button>
          <button class="btn btn-primary" onclick="openAddReference()">${icons.plus} Add</button>
        </div>
      </div>
      <div class="filter-bar">
        <div style="position:relative"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-dim)">${icons.search}</span><input type="text" placeholder="Search references..." value="${esc(refFilters.search)}" oninput="refFilters.search=this.value;debounceSearch()" onkeydown="if(event.key==='Enter')renderReferences()" style="padding-left:32px;width:220px"></div>
        <div class="filter-pills">
          <div class="pill ${refFilters.liked?'active':''}" onclick="refFilters.liked=!refFilters.liked;renderReferences()">${icons.heart(refFilters.liked)} Liked</div>
          ${visibleCats.map(c => `<div class="pill ${refFilters.category===c?'active':''}" onclick="refFilters.category=refFilters.category==='${c}'?'':'${c}';renderReferences()">${c}</div>`).join('')}
          ${!showAllCategories && hiddenCount > 0 ? `<div class="pill" onclick="showAllCategories=true;renderReferences()" style="color:var(--accent)">+${hiddenCount} more</div>` : ''}
          ${showAllCategories ? `<div class="pill" onclick="showAllCategories=false;renderReferences()" style="color:var(--text-dim)">Show less</div>` : ''}
        </div>
        <select class="full" style="width:120px" onchange="refFilters.style=this.value;renderReferences()">
          <option value="">All styles</option>${STYLES.map(s => `<option ${refFilters.style===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select style="width:120px" onchange="refFilters.platform=this.value;renderReferences()">
          <option value="">All platforms</option>${PLATFORMS.map(p => `<option ${refFilters.platform===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      ${refs.length === 0 ? `<div class="empty-state">${icons.upload}<h3>No references yet</h3><p>Start building your inspiration library</p><button class="btn btn-primary" onclick="openAddReference()">${icons.plus} Add Reference</button></div>` :
        refView === 'moodboard' ?
          `${refs.filter(r=>r.liked).length === 0 ? '<div class="empty-state"><h3>No liked references</h3><p>Like some references to build your moodboard</p><button class="btn btn-secondary" onclick="refView=\'gallery\';renderReferences()">Switch to Gallery</button></div>' : `<div class="moodboard-grid">${refs.filter(r=>r.liked).map(r => refCard(r, true)).join('')}</div>`}` :
          `<div class="ref-gallery">${refs.map(r => refCard(r)).join('')}</div>`
      }
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

// Debounce for search-as-you-type
let searchDebounce = null;
function debounceSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderReferences(), 300);
}

function refCard(ref, large) {
  const hasImage = ref.imageUrl && ref.imageUrl.trim();
  const previewContent = hasImage
    ? `<img src="${esc(ref.imageUrl)}" alt="${esc(ref.title)}" class="ref-preview-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const fallbackBg = `<div class="ref-preview-fallback" style="background:${styleGradient(ref.style)};${hasImage ? 'display:none' : 'display:flex'}"><span class="ref-preview-label">${esc(ref.style || 'reference')}</span></div>`;

  return `<div class="ref-card ${large?'moodboard-card':''}" onclick="showRefDetail('${ref.id}')">
    <div class="ref-preview">${previewContent}${fallbackBg}
      <div class="ref-overlay"><div class="ref-meta">${ref.tags?.map(t=>`<span class="tag-chip">${t}</span>`).join('')||''}</div></div>
    </div>
    <button class="like-btn ${ref.liked?'liked':''}" onclick="event.stopPropagation();toggleLike('${ref.id}',${!ref.liked})">${icons.heart(ref.liked)}</button>
    <div class="ref-body">
      <div class="ref-title">${esc(ref.title)}</div>
      <div class="ref-meta">
        <span class="badge badge-source">${ref.source}</span>
        <span class="badge badge-category">${ref.category}</span>
        ${ref.platform?`<span class="badge badge-platform">${ref.platform}</span>`:''}
      </div>
    </div>
  </div>`;
}

async function toggleLike(id, liked) {
  try {
    await apiPut(`/api/references/${id}`, { liked });
    render();
  } catch (e) { toast('Failed to update: ' + e.message, 'error'); }
}

async function showRefDetail(id) {
  refDetail = id;
  renderReferences();
}

async function renderRefDetail() {
  showLoading(main());
  try {
    const refs = await api('/api/references');
    const ref = refs.find(r => r.id === refDetail);
    if (!ref) { refDetail = null; return renderReferences(); }

    const hasImage = ref.imageUrl && ref.imageUrl.trim();
    const imageSection = hasImage
      ? `<img src="${esc(ref.imageUrl)}" alt="${esc(ref.title)}" style="width:100%;height:280px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--border)" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
      : '';
    const fallbackSection = `<div style="height:280px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);position:relative;${hasImage ? 'display:none' : ''}"><div class="ref-preview-bg" style="background:${styleGradient(ref.style)};position:absolute;inset:0"></div><div class="ref-preview-label" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1">${ref.style}</div></div>`;

    main().innerHTML = `
      <div class="detail-back" onclick="refDetail=null;renderReferences()">${icons.back} Back to References</div>
      <div class="detail-header">
        <div>
          <h1 class="page-title">${esc(ref.title)}</h1>
          <div class="ref-meta" style="margin-top:8px">
            <span class="badge badge-source">${ref.source}</span>
            <span class="badge badge-category">${ref.category}</span>
            <span class="badge badge-style">${ref.style}</span>
            <span class="badge badge-platform">${ref.platform}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="like-btn ${ref.liked?'liked':''}" style="position:static" onclick="toggleLike('${ref.id}',${!ref.liked})">${icons.heart(ref.liked)}</button>
          <button class="btn btn-ghost" onclick="openEditReference('${ref.id}')">${icons.edit} Edit</button>
          <button class="btn btn-danger btn-ghost" onclick="deleteReference('${ref.id}')">${icons.trash} Delete</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>${imageSection}${fallbackSection}</div>
        <div>
          ${ref.url ? `<div class="form-group"><div class="form-label">URL</div><a href="${esc(ref.url)}" target="_blank">${esc(ref.url)}</a></div>` : ''}
          ${ref.description ? `<div class="form-group"><div class="form-label">Description</div><p style="color:var(--text-muted)">${esc(ref.description)}</p></div>` : ''}
          ${ref.notes ? `<div class="form-group"><div class="form-label">Notes</div><p style="color:var(--text-muted)">${esc(ref.notes)}</p></div>` : ''}
          ${ref.colorPalette?.length ? `<div class="form-group"><div class="form-label">Color Palette</div><div class="swatch-row">${ref.colorPalette.map(c => `<div class="color-card"><div class="swatch" style="background:${c}"></div><div class="swatch-hex">${c}</div></div>`).join('')}</div></div>` : ''}
          ${ref.tags?.length ? `<div class="form-group"><div class="form-label">Tags</div><div>${ref.tags.map(t=>`<span class="tag-chip">${t}</span>`).join(' ')}</div></div>` : ''}
        </div>
      </div>
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

function openAddReference() {
  openModal(`
    <div class="modal-title">Add Reference</div>
    <div class="form-group"><label class="form-label">Title</label><input class="full" id="refTitle" placeholder="e.g. Stripe Dashboard"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">URL</label><input class="full" id="refUrl" placeholder="https://..."></div>
      <div class="form-group"><label class="form-label">Image URL</label><input class="full" id="refImgUrl" placeholder="https://..."></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="full" id="refDesc" rows="2"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Source</label><select class="full" id="refSource">${SOURCES.map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Platform</label><select class="full" id="refPlatform">${PLATFORMS.map(p=>`<option>${p}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category</label><select class="full" id="refCategory">${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Style</label><select class="full" id="refStyle">${STYLES.map(s=>`<option>${s}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Tags (comma separated)</label><input class="full" id="refTags" placeholder="e.g. clean, modern, gradient"></div>
    <div class="form-group"><label class="form-label">Color Palette (comma separated hex)</label><input class="full" id="refColors" placeholder="e.g. #ec4899, #8b5cf6, #06b6d4"></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="full" id="refNotes" rows="2"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewReference()">Add Reference</button>
    </div>
  `);
}

async function saveNewReference() {
  try {
    const data = {
      title: $('#refTitle').value, url: $('#refUrl').value, imageUrl: $('#refImgUrl').value,
      description: $('#refDesc').value, source: $('#refSource').value, platform: $('#refPlatform').value,
      category: $('#refCategory').value, style: $('#refStyle').value, notes: $('#refNotes').value,
      tags: $('#refTags').value.split(',').map(t=>t.trim()).filter(Boolean),
      colorPalette: $('#refColors').value.split(',').map(t=>t.trim()).filter(Boolean),
    };
    if (!data.title.trim()) { toast('Title is required', 'error'); return; }
    await apiPost('/api/references', data);
    closeModal(); toast('Reference added'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function openEditReference(id) {
  try {
    const refs = await api('/api/references');
    const ref = refs.find(r => r.id === id);
    if (!ref) return;
    openModal(`
      <div class="modal-title">Edit Reference</div>
      <div class="form-group"><label class="form-label">Title</label><input class="full" id="refTitle" value="${esc(ref.title)}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">URL</label><input class="full" id="refUrl" value="${esc(ref.url)}"></div>
        <div class="form-group"><label class="form-label">Image URL</label><input class="full" id="refImgUrl" value="${esc(ref.imageUrl||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="full" id="refDesc" rows="2">${esc(ref.description)}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Source</label><select class="full" id="refSource">${SOURCES.map(s=>`<option ${ref.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Platform</label><select class="full" id="refPlatform">${PLATFORMS.map(p=>`<option ${ref.platform===p?'selected':''}>${p}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Category</label><select class="full" id="refCategory">${CATEGORIES.map(c=>`<option ${ref.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Style</label><select class="full" id="refStyle">${STYLES.map(s=>`<option ${ref.style===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label class="form-label">Tags</label><input class="full" id="refTags" value="${(ref.tags||[]).join(', ')}"></div>
      <div class="form-group"><label class="form-label">Color Palette</label><input class="full" id="refColors" value="${(ref.colorPalette||[]).join(', ')}"></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="full" id="refNotes" rows="2">${esc(ref.notes||'')}</textarea></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveEditReference('${id}')">Save</button>
      </div>
    `);
  } catch (e) { toast('Failed to load: ' + e.message, 'error'); }
}

async function saveEditReference(id) {
  try {
    const data = {
      title: $('#refTitle').value, url: $('#refUrl').value, imageUrl: $('#refImgUrl').value,
      description: $('#refDesc').value, source: $('#refSource').value, platform: $('#refPlatform').value,
      category: $('#refCategory').value, style: $('#refStyle').value, notes: $('#refNotes').value,
      tags: $('#refTags').value.split(',').map(t=>t.trim()).filter(Boolean),
      colorPalette: $('#refColors').value.split(',').map(t=>t.trim()).filter(Boolean),
    };
    await apiPut(`/api/references/${id}`, data);
    closeModal(); toast('Reference updated'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function deleteReference(id) {
  if (!confirm('Delete this reference?')) return;
  try {
    await apiDel(`/api/references/${id}`);
    refDetail = null; toast('Reference deleted'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

// ============ DESIGN SYSTEM ============
let dsEditSection = null;

async function renderDesignSystem() {
  showLoading(main());
  try {
    const ds = await api('/api/design-system');
    state.designSystem = ds;

    main().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1 class="page-title">Design System</h1><p class="page-subtitle">Your documented design tokens and components</p></div>
        <button class="btn btn-secondary" onclick="extractFromFigma()">${icons.figma} Extract from Figma</button>
      </div>

      <!-- Colors -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="section-title" style="margin:0">Colors</div>
          <button class="btn btn-ghost btn-sm" onclick="openAddColor()">+ Add Color</button>
        </div>
        ${ds.colors?.length ? `<div style="display:flex;gap:20px;flex-wrap:wrap">${ds.colors.map((c,i) => `
          <div class="color-card" style="cursor:pointer" onclick="openEditColor(${i})">
            <div class="swatch swatch-lg" style="background:${c.hex}"></div>
            <div class="swatch-name">${esc(c.name)}</div>
            <div class="swatch-hex">${c.hex}</div>
            ${c.usage?`<div style="font-size:10px;color:var(--text-dim);max-width:80px;text-align:center">${esc(c.usage)}</div>`:''}
          </div>
        `).join('')}</div>` : '<p style="color:var(--text-muted)">No colors defined yet</p>'}
      </div>

      <!-- Typography -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="section-title" style="margin:0">Typography</div>
          <button class="btn btn-ghost btn-sm" onclick="openAddTypography()">+ Add Style</button>
        </div>
        ${ds.typography?.length ? ds.typography.map((t,i) => `
          <div class="type-specimen" onclick="openEditTypography(${i})" style="cursor:pointer">
            <div class="type-sample" style="font-family:${t.family||'DM Sans'},sans-serif;font-weight:${t.weight||400};font-size:${t.size||'16px'}">${esc(t.name)} — The quick brown fox jumps over the lazy dog</div>
            <div class="type-meta"><span>${t.family||'—'}</span><span>${t.weight||'—'}</span><span>${t.size||'—'}</span>${t.usage?`<span>${esc(t.usage)}</span>`:''}</div>
          </div>
        `).join('') : '<p style="color:var(--text-muted)">No typography styles defined</p>'}
      </div>

      <!-- Spacing -->
      <div class="card" style="margin-bottom:20px">
        <div class="section-title">Spacing</div>
        <div style="display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap">
          ${(ds.spacing?.scale||[0,4,8,12,16,24,32,48,64]).map(s => `
            <div style="text-align:center"><div style="width:${Math.max(s,4)}px;height:${Math.max(s,4)}px;background:var(--accent);border-radius:2px;opacity:0.6;margin:0 auto 4px"></div><div style="font-size:10px;color:var(--text-muted)">${s}px</div></div>
          `).join('')}
        </div>
        <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">Base unit: ${ds.spacing?.base||8}px</div>
      </div>

      <!-- Components -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="section-title" style="margin:0">Components</div>
          <button class="btn btn-ghost btn-sm" onclick="openAddComponent()">+ Add Component</button>
        </div>
        ${ds.components?.length ? `<div class="card-grid card-grid-3">${ds.components.map((c,i) => `
          <div class="card" style="cursor:pointer" onclick="openEditComponent(${i})">
            <div style="font-weight:600;margin-bottom:4px">${esc(c.name)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${esc(c.description||'')}</div>
            ${c.variants?.length?`<div style="margin-bottom:6px">${c.variants.map(v=>`<span class="tag-chip">${v}</span>`).join(' ')}</div>`:''}
            ${c.figmaLink?`<a href="${esc(c.figmaLink)}" target="_blank" onclick="event.stopPropagation()" style="font-size:11px">${icons.figma} Figma</a>`:''}
          </div>
        `).join('')}</div>` : '<p style="color:var(--text-muted)">No components documented</p>'}
      </div>

      <!-- Principles -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="section-title" style="margin:0">Design Principles</div>
          <button class="btn btn-ghost btn-sm" onclick="openEditPrinciples()">Edit</button>
        </div>
        ${ds.principles?.length ? `<ol style="padding-left:20px">${ds.principles.map(p => `<li style="margin-bottom:8px;color:var(--text-muted)">${esc(p)}</li>`).join('')}</ol>` : '<p style="color:var(--text-muted)">No principles defined</p>'}
      </div>
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

function openAddColor() {
  openModal(`<div class="modal-title">Add Color</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="cName" placeholder="Primary"></div>
    <div class="form-group"><label class="form-label">Hex</label><div style="display:flex;gap:8px;align-items:center"><input class="full" id="cHex" placeholder="#ec4899" oninput="updateColorPreview()"><div id="colorPreview" class="color-preview-swatch"></div></div></div>
    <div class="form-group"><label class="form-label">Usage</label><input class="full" id="cUsage" placeholder="Buttons, links"></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveColor()">Add</button></div>`);
}

function updateColorPreview() {
  const hex = $('#cHex')?.value;
  const preview = $('#colorPreview');
  if (preview && hex) preview.style.background = hex;
}

async function saveColor() {
  try {
    const hex = $('#cHex').value.trim();
    if (!/^#[0-9a-fA-F]{3,8}$/.test(hex)) { toast('Invalid hex color', 'error'); return; }
    const ds = await api('/api/design-system');
    if (!ds.colors) ds.colors = [];
    ds.colors.push({ name: $('#cName').value, hex, usage: $('#cUsage').value });
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Color added'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openEditColor(idx) {
  const c = state.designSystem.colors[idx];
  openModal(`<div class="modal-title">Edit Color</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="cName" value="${esc(c.name)}"></div>
    <div class="form-group"><label class="form-label">Hex</label><div style="display:flex;gap:8px;align-items:center"><input class="full" id="cHex" value="${c.hex}" oninput="updateColorPreview()"><div id="colorPreview" class="color-preview-swatch" style="background:${c.hex}"></div></div></div>
    <div class="form-group"><label class="form-label">Usage</label><input class="full" id="cUsage" value="${esc(c.usage||'')}"></div>
    <div class="modal-actions"><button class="btn btn-danger" onclick="removeColor(${idx})">Delete</button><div style="flex:1"></div><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateColor(${idx})">Save</button></div>`);
}

async function updateColor(idx) {
  try {
    const hex = $('#cHex').value.trim();
    if (!/^#[0-9a-fA-F]{3,8}$/.test(hex)) { toast('Invalid hex color', 'error'); return; }
    const ds = await api('/api/design-system');
    ds.colors[idx] = { name: $('#cName').value, hex, usage: $('#cUsage').value };
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Color updated'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function removeColor(idx) {
  try {
    const ds = await api('/api/design-system');
    ds.colors.splice(idx, 1);
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Color removed'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openAddTypography() {
  openModal(`<div class="modal-title">Add Typography Style</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="tName" placeholder="Heading 1"></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Font Family</label><input class="full" id="tFamily" placeholder="DM Sans"></div>
    <div class="form-group"><label class="form-label">Weight</label><input class="full" id="tWeight" placeholder="700"></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Size</label><input class="full" id="tSize" placeholder="32px"></div>
    <div class="form-group"><label class="form-label">Usage</label><input class="full" id="tUsage" placeholder="Page titles"></div></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveTypography()">Add</button></div>`);
}

async function saveTypography() {
  try {
    const ds = await api('/api/design-system');
    if (!ds.typography) ds.typography = [];
    ds.typography.push({ name: $('#tName').value, family: $('#tFamily').value, weight: $('#tWeight').value, size: $('#tSize').value, usage: $('#tUsage').value });
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Typography added'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openEditTypography(idx) {
  const t = state.designSystem.typography[idx];
  openModal(`<div class="modal-title">Edit Typography</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="tName" value="${esc(t.name)}"></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Family</label><input class="full" id="tFamily" value="${esc(t.family||'')}"></div>
    <div class="form-group"><label class="form-label">Weight</label><input class="full" id="tWeight" value="${t.weight||''}"></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Size</label><input class="full" id="tSize" value="${t.size||''}"></div>
    <div class="form-group"><label class="form-label">Usage</label><input class="full" id="tUsage" value="${esc(t.usage||'')}"></div></div>
    <div class="modal-actions"><button class="btn btn-danger" onclick="removeTypography(${idx})">Delete</button><div style="flex:1"></div><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateTypography(${idx})">Save</button></div>`);
}

async function updateTypography(idx) {
  try {
    const ds = await api('/api/design-system');
    ds.typography[idx] = { name: $('#tName').value, family: $('#tFamily').value, weight: $('#tWeight').value, size: $('#tSize').value, usage: $('#tUsage').value };
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Updated'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function removeTypography(idx) {
  try {
    const ds = await api('/api/design-system');
    ds.typography.splice(idx, 1);
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Removed'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openAddComponent() {
  openModal(`<div class="modal-title">Add Component</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="compName" placeholder="Button"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="full" id="compDesc" rows="2"></textarea></div>
    <div class="form-group"><label class="form-label">Variants (comma separated)</label><input class="full" id="compVariants" placeholder="primary, secondary, ghost"></div>
    <div class="form-group"><label class="form-label">Figma Link</label><input class="full" id="compFigma" placeholder="https://figma.com/..."></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveComponent()">Add</button></div>`);
}

async function saveComponent() {
  try {
    const ds = await api('/api/design-system');
    if (!ds.components) ds.components = [];
    ds.components.push({ name: $('#compName').value, description: $('#compDesc').value, variants: $('#compVariants').value.split(',').map(v=>v.trim()).filter(Boolean), figmaLink: $('#compFigma').value, usage: '' });
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Component added'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openEditComponent(idx) {
  const c = state.designSystem.components[idx];
  openModal(`<div class="modal-title">Edit Component</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="compName" value="${esc(c.name)}"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="full" id="compDesc" rows="2">${esc(c.description||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Variants</label><input class="full" id="compVariants" value="${(c.variants||[]).join(', ')}"></div>
    <div class="form-group"><label class="form-label">Figma Link</label><input class="full" id="compFigma" value="${esc(c.figmaLink||'')}"></div>
    <div class="modal-actions"><button class="btn btn-danger" onclick="removeComponent(${idx})">Delete</button><div style="flex:1"></div><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateComponent(${idx})">Save</button></div>`);
}

async function updateComponent(idx) {
  try {
    const ds = await api('/api/design-system');
    ds.components[idx] = { name: $('#compName').value, description: $('#compDesc').value, variants: $('#compVariants').value.split(',').map(v=>v.trim()).filter(Boolean), figmaLink: $('#compFigma').value };
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Updated'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function removeComponent(idx) {
  try {
    const ds = await api('/api/design-system');
    ds.components.splice(idx, 1);
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Removed'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openEditPrinciples() {
  const p = (state.designSystem?.principles||[]).join('\n');
  openModal(`<div class="modal-title">Design Principles</div>
    <div class="form-group"><label class="form-label">One principle per line</label><textarea class="full" id="princ" rows="8">${esc(p)}</textarea></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="savePrinciples()">Save</button></div>`);
}

async function savePrinciples() {
  try {
    const ds = await api('/api/design-system');
    ds.principles = $('#princ').value.split('\n').map(l=>l.trim()).filter(Boolean);
    await apiPut('/api/design-system', ds);
    closeModal(); toast('Principles saved'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function extractFromFigma() {
  openModal(`<div class="modal-title">Extract from Figma</div>
    <div class="coming-soon-badge">Coming Soon</div>
    <p style="color:var(--text-muted);margin-bottom:16px">Automatic Figma extraction requires the AI agent to use the Figma MCP integration. You can add notes below for manual extraction, or ask the AI in chat to extract your design system.</p>
    <div class="form-group"><label class="form-label">Figma File URL</label><input class="full" id="figmaUrl" placeholder="https://figma.com/file/..."></div>
    <div class="form-group"><label class="form-label">Notes for AI (optional)</label><textarea class="full" id="figmaNotes" rows="3" placeholder="e.g. Primary color is #ec4899, font is DM Sans. The AI will use these notes to populate your design system."></textarea></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doExtract()">Save Notes</button></div>`);
}

async function doExtract() {
  try {
    await apiPost('/api/design-system/extract', { figmaUrl: $('#figmaUrl').value, notes: $('#figmaNotes').value });
    closeModal(); toast('Notes saved — ask the AI in chat to extract your design system'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

// ============ KNOWLEDGE BASE ============
let kbTab = 'documents';

async function renderKnowledge() {
  showLoading(main());
  try {
    const docs = await api('/api/documents');
    main().innerHTML = `
      <h1 class="page-title">Knowledge Base</h1>
      <p class="page-subtitle">Upload and search design documentation</p>
      <div class="tabs">
        <div class="tab ${kbTab==='documents'?'active':''}" onclick="kbTab='documents';renderKnowledge()">Documents</div>
        <div class="tab ${kbTab==='upload'?'active':''}" onclick="kbTab='upload';renderKnowledge()">Upload</div>
        <div class="tab ${kbTab==='search'?'active':''}" onclick="kbTab='search';renderKnowledge()">Search</div>
      </div>
      <div id="kbContent"></div>
    `;

    if (kbTab === 'documents') {
      $('#kbContent').innerHTML = docs.length ? docs.map(d => `
        <div class="doc-card">
          <div class="doc-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M12 3v4h4"/></svg></div>
          <div class="doc-info"><div class="doc-name">${esc(d.name)}</div><div class="doc-meta"><span class="badge badge-category">${d.category}</span> ${d.chunkCount} chunks &middot; ${(d.size/1024).toFixed(1)}KB</div></div>
          <div class="doc-actions"><button class="btn btn-ghost btn-sm btn-danger" onclick="deleteDoc('${d.id}')">${icons.trash}</button></div>
        </div>
      `).join('') : `<div class="empty-state"><h3>No documents</h3><p>Upload design docs to build your knowledge base</p></div>`;
    } else if (kbTab === 'upload') {
      $('#kbContent').innerHTML = `
        <div class="dropzone" id="dropzone" onclick="$('#fileInput').click()">
          ${icons.upload}
          <p>Drop files here or <span class="highlight">browse</span></p>
          <p style="font-size:11px;margin-top:4px">PDF, MD, TXT, HTML supported (max 50MB)</p>
        </div>
        <input type="file" id="fileInput" accept=".pdf,.md,.txt,.html" style="display:none" onchange="uploadFile(this.files[0])">
        <div class="form-row" style="margin-top:16px">
          <div class="form-group"><label class="form-label">Document Name</label><input class="full" id="docName" placeholder="Optional name"></div>
          <div class="form-group"><label class="form-label">Category</label><select class="full" id="docCat">${DOC_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
        </div>
      `;
      const dz = $('#dropzone');
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
      dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); });
    } else {
      $('#kbContent').innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <div style="position:relative;flex:1"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-dim)">${icons.search}</span><input type="text" class="full" id="kbSearch" placeholder="Search knowledge base..." style="padding-left:32px" onkeydown="if(event.key==='Enter')doSearch()"></div>
          <button class="btn btn-primary" onclick="doSearch()">Search</button>
        </div>
        <div id="searchResults"></div>
      `;
    }
  } catch (e) {
    showError(main(), e.message);
  }
}

async function uploadFile(file) {
  if (!file) return;
  // Validate file type
  const allowed = ['.pdf','.md','.txt','.html','.htm'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    toast('Unsupported file type. Use PDF, MD, TXT, or HTML.', 'error');
    return;
  }
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', $('#docName')?.value || file.name);
    fd.append('category', $('#docCat')?.value || 'brand-guidelines');
    const res = await fetch('/api/documents', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed: ' + res.status);
    const data = await res.json();
    toast(`Uploaded: ${data.chunkCount} chunks indexed`);
    kbTab = 'documents'; renderKnowledge();
  } catch (e) { toast('Upload failed: ' + e.message, 'error'); }
}

async function deleteDoc(id) {
  if (!confirm('Delete this document?')) return;
  try {
    await apiDel(`/api/documents/${id}`);
    toast('Document deleted'); renderKnowledge();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function doSearch() {
  const q = $('#kbSearch').value;
  if (!q) return;
  const resultsEl = $('#searchResults');
  resultsEl.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  try {
    const results = await api(`/api/search?q=${encodeURIComponent(q)}&limit=10`);
    const maxScore = results[0]?.score || 1;
    resultsEl.innerHTML = results.length ? results.map(r => `
      <div class="search-result">
        <div class="search-result-header"><span class="search-result-doc">${esc(r.docName)}</span><span class="search-result-score">${r.score.toFixed(2)}</span></div>
        <div class="search-result-content">${esc(r.content.slice(0,300))}${r.content.length>300?'...':''}</div>
        <div class="relevance-bar"><div class="relevance-fill" style="width:${(r.score/maxScore*100).toFixed(0)}%"></div></div>
      </div>
    `).join('') : '<p style="color:var(--text-muted)">No results found</p>';
  } catch (e) {
    resultsEl.innerHTML = `<p style="color:var(--red)">Search failed: ${esc(e.message)}</p>`;
  }
}

// ============ REVIEWS ============
let reviewDetail = null;

async function renderReviews() {
  if (reviewDetail) return renderReviewDetail();
  showLoading(main());
  try {
    const reviews = await api('/api/reviews');
    state.reviews = reviews;

    main().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1 class="page-title">Reviews</h1><p class="page-subtitle">Design audits and feedback</p></div>
        <button class="btn btn-primary" onclick="openAddReview()">${icons.plus} New Review</button>
      </div>
      ${reviews.length ? reviews.map(reviewCard).join('') : '<div class="empty-state"><h3>No reviews yet</h3><p>Start reviewing designs for quality improvements</p></div>'}
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

function reviewCard(r) {
  const sc = r.score;
  return `<div class="card" style="margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:16px" onclick="reviewDetail='${r.id}';renderReviews()">
    ${sc !== null && sc !== undefined ? `<div class="score-badge ${scoreClass(sc)}">${sc}</div>` : '<div class="score-badge" style="border-color:var(--text-dim);color:var(--text-dim)">--</div>'}
    <div style="flex:1">
      <div style="font-weight:600">${esc(r.title)}</div>
      <div style="font-size:12px;color:var(--text-muted)">${r.type} &middot; ${r.findings?.length||0} findings &middot; ${new Date(r.createdAt).toLocaleDateString()}</div>
    </div>
    <span class="badge badge-category">${r.status}</span>
  </div>`;
}

async function renderReviewDetail() {
  showLoading(main());
  try {
    const reviews = await api('/api/reviews');
    state.reviews = reviews;
    const r = reviews.find(x => x.id === reviewDetail);
    if (!r) { reviewDetail = null; return renderReviews(); }

    const catCounts = {};
    (r.findings||[]).forEach(f => { catCounts[f.category] = (catCounts[f.category]||0)+1; });

    main().innerHTML = `
      <div class="detail-back" onclick="reviewDetail=null;renderReviews()">${icons.back} Back to Reviews</div>
      <div class="detail-header">
        <div>
          <h1 class="page-title">${esc(r.title)}</h1>
          <div style="display:flex;gap:8px;margin-top:8px">
            <span class="badge badge-category">${r.type}</span>
            <span class="badge badge-source">${r.status}</span>
            ${r.figmaUrl?`<a href="${esc(r.figmaUrl)}" target="_blank" style="font-size:12px">${icons.figma} Figma</a>`:''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          ${r.score!==null?`<div class="score-badge ${scoreClass(r.score)}">${r.score}</div>`:''}
          <button class="btn btn-ghost" onclick="openEditReview('${r.id}')">${icons.edit} Edit</button>
          <button class="btn btn-danger btn-ghost" onclick="deleteReview('${r.id}')">${icons.trash}</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px">${Object.entries(catCounts).map(([c,n])=>`<span class="pill">${c} (${n})</span>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-title" style="margin:0">Findings</div>
        <button class="btn btn-ghost btn-sm" onclick="openAddFinding('${r.id}')">+ Add Finding</button>
      </div>
      ${(r.findings||[]).map(f => `
        <div class="finding-card ${f.severity}">
          <div style="display:flex;justify-content:space-between">
            <div class="finding-element">${esc(f.element||'')}</div>
            <span class="badge badge-severity-${f.severity}">${f.severity}</span>
          </div>
          <div class="finding-issue">${esc(f.issue||'')}</div>
          ${f.recommendation?`<div class="finding-rec">${esc(f.recommendation)}</div>`:''}
          <div style="margin-top:6px"><span class="tag-chip">${f.category||''}</span></div>
        </div>
      `).join('') || '<p style="color:var(--text-muted)">No findings yet</p>'}
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

function openAddReview() {
  openModal(`<div class="modal-title">New Review</div>
    <div class="form-group"><label class="form-label">Title</label><input class="full" id="revTitle" placeholder="Homepage Audit"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type</label><select class="full" id="revType">${REVIEW_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Figma URL</label><input class="full" id="revFigma" placeholder="https://figma.com/..."></div>
    </div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNewReview()">Create</button></div>`);
}

async function saveNewReview() {
  try {
    const title = $('#revTitle').value.trim();
    if (!title) { toast('Title is required', 'error'); return; }
    await apiPost('/api/reviews', { title, type: $('#revType').value, figmaUrl: $('#revFigma').value });
    closeModal(); toast('Review created'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function openEditReview(id) {
  // Fetch current review data to pre-populate
  try {
    const reviews = await api('/api/reviews');
    const r = reviews.find(x => x.id === id);
    if (!r) { toast('Review not found', 'error'); return; }
    openModal(`<div class="modal-title">Edit Review</div>
      <div class="form-group"><label class="form-label">Title</label><input class="full" id="revTitle" value="${esc(r.title)}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label><select class="full" id="revStatus">${REVIEW_STATUSES.map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Score (1-100)</label><input class="full" id="revScore" type="number" min="1" max="100" value="${r.score||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Figma URL</label><input class="full" id="revFigma" value="${esc(r.figmaUrl||'')}"></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateReview('${id}')">Save</button></div>`);
  } catch (e) { toast('Failed to load review: ' + e.message, 'error'); }
}

async function updateReview(id) {
  try {
    const data = { title: $('#revTitle').value, status: $('#revStatus').value, figmaUrl: $('#revFigma').value };
    const score = parseInt($('#revScore').value);
    if (!isNaN(score) && score >= 1 && score <= 100) data.score = score;
    await apiPut(`/api/reviews/${id}`, data);
    closeModal(); toast('Updated'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    await apiDel(`/api/reviews/${id}`);
    reviewDetail = null; toast('Deleted'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

function openAddFinding(reviewId) {
  openModal(`<div class="modal-title">Add Finding</div>
    <div class="form-group"><label class="form-label">Element</label><input class="full" id="fElem" placeholder="Navigation bar"></div>
    <div class="form-group"><label class="form-label">Issue</label><textarea class="full" id="fIssue" rows="2" placeholder="Describe the issue..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Severity</label><select class="full" id="fSev">${SEVERITIES.map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Category</label><select class="full" id="fCat">${FINDING_CATS.map(c=>`<option>${c}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Recommendation</label><textarea class="full" id="fRec" rows="2" placeholder="How to fix..."></textarea></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveFinding('${reviewId}')">Add</button></div>`);
}

async function saveFinding(reviewId) {
  try {
    const reviews = await api('/api/reviews');
    const r = reviews.find(x => x.id === reviewId);
    if (!r) return;
    if (!r.findings) r.findings = [];
    r.findings.push({
      id: Date.now().toString(36),
      element: $('#fElem').value, issue: $('#fIssue').value,
      severity: $('#fSev').value, category: $('#fCat').value,
      recommendation: $('#fRec').value
    });
    await apiPut(`/api/reviews/${reviewId}`, { findings: r.findings });
    closeModal(); toast('Finding added'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

// ============ PROJECTS ============
let projectDetail = null;

async function renderProjects() {
  if (projectDetail) return renderProjectDetail();
  showLoading(main());
  try {
    const projects = await api('/api/projects');
    state.projects = projects;

    main().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1 class="page-title">Projects</h1><p class="page-subtitle">Track your design projects</p></div>
        <button class="btn btn-primary" onclick="openAddProject()">${icons.plus} New Project</button>
      </div>
      ${projects.length ? `<div class="card-grid card-grid-2">${projects.map(projectCard).join('')}</div>` : '<div class="empty-state"><h3>No projects</h3><p>Create your first design project</p></div>'}
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

function projectCard(p) {
  const statusIdx = PROJECT_STATUSES.indexOf(p.status);
  return `<div class="card" style="cursor:pointer" onclick="projectDetail='${p.id}';renderProjects()">
    <div style="font-weight:600;font-size:15px;margin-bottom:4px">${esc(p.name)}</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${esc(p.description||'').slice(0,80)}</div>
    <div class="status-steps">${PROJECT_STATUSES.map((s,i) => `
      <div class="status-step">
        <div class="step-dot ${i<statusIdx?'done':i===statusIdx?'active':''}">${i<statusIdx?icons.check:(i+1)}</div>
        ${i<PROJECT_STATUSES.length-1?`<div class="step-line ${i<statusIdx?'done':''}"></div>`:''}
      </div>
    `).join('')}</div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--text-dim)">
      ${PROJECT_STATUSES.map(s => `<span>${s.replace('-',' ')}</span>`).join('')}
    </div>
    ${p.figmaUrl?`<div style="margin-top:12px;font-size:12px">${icons.figma} <a href="${esc(p.figmaUrl)}" target="_blank" onclick="event.stopPropagation()">Figma</a></div>`:''}
  </div>`;
}

async function renderProjectDetail() {
  showLoading(main());
  try {
    const projects = await api('/api/projects');
    state.projects = projects;
    const p = projects.find(x => x.id === projectDetail);
    if (!p) { projectDetail = null; return renderProjects(); }

    main().innerHTML = `
      <div class="detail-back" onclick="projectDetail=null;renderProjects()">${icons.back} Back to Projects</div>
      <div class="detail-header">
        <div>
          <h1 class="page-title">${esc(p.name)}</h1>
          <span class="badge badge-category">${p.status}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost" onclick="openEditProject('${p.id}')">${icons.edit} Edit</button>
          <button class="btn btn-danger btn-ghost" onclick="deleteProject('${p.id}')">${icons.trash}</button>
        </div>
      </div>
      <div class="status-steps" style="margin-bottom:24px">${PROJECT_STATUSES.map((s,i) => {
        const idx = PROJECT_STATUSES.indexOf(p.status);
        return `<div class="status-step"><div class="step-dot ${i<idx?'done':i===idx?'active':''}">${i<idx?icons.check:(i+1)}</div>${i<PROJECT_STATUSES.length-1?`<div class="step-line ${i<idx?'done':''}"></div>`:''}</div>`;
      }).join('')}</div>
      ${p.description?`<div class="card" style="margin-bottom:16px"><div class="form-label">Description</div><p style="color:var(--text-muted)">${esc(p.description)}</p></div>`:''}
      ${p.figmaUrl?`<div class="card" style="margin-bottom:16px"><div class="form-label">Figma File</div><a href="${esc(p.figmaUrl)}" target="_blank">${icons.figma} ${esc(p.figmaUrl)}</a></div>`:''}
      ${p.notes?`<div class="card" style="margin-bottom:16px"><div class="form-label">Notes</div><p style="color:var(--text-muted);white-space:pre-wrap">${esc(p.notes)}</p></div>`:''}
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

function openAddProject() {
  openModal(`<div class="modal-title">New Project</div>
    <div class="form-group"><label class="form-label">Name</label><input class="full" id="projName" placeholder="Website Redesign"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="full" id="projDesc" rows="2"></textarea></div>
    <div class="form-group"><label class="form-label">Figma URL</label><input class="full" id="projFigma" placeholder="https://figma.com/..."></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="full" id="projNotes" rows="2"></textarea></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNewProject()">Create</button></div>`);
}

async function saveNewProject() {
  try {
    const name = $('#projName').value.trim();
    if (!name) { toast('Name is required', 'error'); return; }
    await apiPost('/api/projects', { name, description: $('#projDesc').value, figmaUrl: $('#projFigma').value, notes: $('#projNotes').value });
    closeModal(); toast('Project created'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function openEditProject(id) {
  // Fetch current project to pre-populate
  try {
    const projects = await api('/api/projects');
    const p = projects.find(x => x.id === id);
    if (!p) { toast('Project not found', 'error'); return; }
    openModal(`<div class="modal-title">Edit Project</div>
      <div class="form-group"><label class="form-label">Name</label><input class="full" id="projName" value="${esc(p.name)}"></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="full" id="projDesc" rows="2">${esc(p.description||'')}</textarea></div>
      <div class="form-group"><label class="form-label">Status</label><select class="full" id="projStatus">${PROJECT_STATUSES.map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Figma URL</label><input class="full" id="projFigma" value="${esc(p.figmaUrl||'')}"></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="full" id="projNotes" rows="3">${esc(p.notes||'')}</textarea></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateProject('${id}')">Save</button></div>`);
  } catch (e) { toast('Failed to load project: ' + e.message, 'error'); }
}

async function updateProject(id) {
  try {
    const data = {
      name: $('#projName').value,
      description: $('#projDesc').value,
      status: $('#projStatus').value,
      figmaUrl: $('#projFigma').value,
      notes: $('#projNotes').value
    };
    await apiPut(`/api/projects/${id}`, data);
    closeModal(); toast('Updated'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    await apiDel(`/api/projects/${id}`);
    projectDetail = null; toast('Deleted'); render();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

// ============ SETTINGS ============
async function renderSettings() {
  showLoading(main());
  try {
    const config = await api('/api/config');

    main().innerHTML = `
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your design workspace</p>
      <div class="card" style="margin-bottom:20px">
        <div class="section-title">${icons.figma} Figma Integration</div>
        <div class="form-group"><label class="form-label">Personal Access Token</label><input class="full" id="cfgToken" type="password" value="${esc(config.figmaToken||'')}" placeholder="figd_..."></div>
        <div class="form-group"><label class="form-label">MCP Endpoint</label><input class="full" id="cfgMcp" value="${esc(config.mcpEndpoint||'https://mcp.figma.com/mcp')}"></div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Get your token from Figma > Settings > Personal Access Tokens</p>
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="section-title">Preferences</div>
        <div class="form-group"><label class="form-label">Preferred Styles (comma separated)</label><input class="full" id="cfgStyles" value="${(config.preferredStyles||[]).join(', ')}"></div>
        <div class="form-group"><label class="form-label">Brand Colors (comma separated hex)</label><input class="full" id="cfgColors" value="${(config.brandColors||[]).join(', ')}"></div>
        <div class="form-group"><label class="form-label">Typography Preferences</label><input class="full" id="cfgTypo" value="${(config.typographyPreferences||[]).join(', ')}"></div>
      </div>
      <button class="btn btn-primary" onclick="saveConfig()">Save Settings</button>
    `;
  } catch (e) {
    showError(main(), e.message);
  }
}

async function saveConfig() {
  try {
    await apiPut('/api/config', {
      figmaToken: $('#cfgToken').value,
      mcpEndpoint: $('#cfgMcp').value,
      preferredStyles: $('#cfgStyles').value.split(',').map(s=>s.trim()).filter(Boolean),
      brandColors: $('#cfgColors').value.split(',').map(s=>s.trim()).filter(Boolean),
      typographyPreferences: $('#cfgTypo').value.split(',').map(s=>s.trim()).filter(Boolean),
    });
    toast('Settings saved');
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
}

// ============ Utilities ============
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
