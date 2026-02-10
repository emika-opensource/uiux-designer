const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

// Data directory
const DATA_DIR = fs.existsSync('/home/node/emika')
  ? '/home/node/emika/design-studio'
  : path.join(__dirname, 'data');

fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(path.join(DATA_DIR, 'uploads'));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer config
const storage = multer.diskStorage({
  destination: path.join(DATA_DIR, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ============ Data helpers ============
function loadJSON(name, fallback) {
  if (fallback === undefined) fallback = [];
  const p = path.join(DATA_DIR, name);
  try { return fs.readJsonSync(p); } catch { return fallback; }
}
function saveJSON(name, data) {
  fs.writeJsonSync(path.join(DATA_DIR, name), data, { spaces: 2 });
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// ============ BM25 Search Engine ============
const STOP_WORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can','need',
  'to','of','in','for','on','with','at','by','from','as','into','through','during','before',
  'after','above','below','between','out','off','over','under','again','further','then','once',
  'here','there','when','where','why','how','all','both','each','few','more','most','other',
  'some','such','no','nor','not','only','own','same','so','than','too','very','and','but',
  'or','if','while','about','it','its','this','that','these','those','i','me','my','we','our',
  'you','your','he','him','his','she','her','they','them','their','what','which','who','whom']);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function bm25Search(query, chunks, limit = 5) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
  const N = chunks.length;
  const avgDl = chunks.reduce((s, c) => s + tokenize(c.content).length, 0) / (N || 1);
  const k1 = 1.5, b = 0.75;
  const df = {};
  chunks.forEach(chunk => {
    const unique = new Set(tokenize(chunk.content));
    unique.forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const scored = chunks.map(chunk => {
    const tokens = tokenize(chunk.content);
    const dl = tokens.length;
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    let score = 0;
    queryTokens.forEach(qt => {
      if (!tf[qt]) return;
      const idf = Math.log((N - (df[qt] || 0) + 0.5) / ((df[qt] || 0) + 0.5) + 1);
      const tfNorm = (tf[qt] * (k1 + 1)) / (tf[qt] + k1 * (1 - b + b * dl / avgDl));
      score += idf * tfNorm;
    });
    return { ...chunk, score };
  }).filter(c => c.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ============ Text extraction ============
async function extractText(filePath, mimetype, originalname) {
  const ext = path.extname(originalname).toLowerCase();
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buf = await fs.readFile(filePath);
      const data = await pdfParse(buf);
      return data.text;
    } catch (e) {
      return `[PDF extraction failed: ${e.message}]`;
    }
  }
  return await fs.readFile(filePath, 'utf-8');
}

function chunkText(text, chunkSize = 500) {
  const sentences = text.replace(/\r\n/g, '\n').split(/(?<=[.!?\n])\s+/);
  const chunks = [];
  let current = '';
  let pos = 0;
  for (const sentence of sentences) {
    if (current.length + sentence.length > chunkSize && current.length > 0) {
      chunks.push({ content: current.trim(), position: pos++ });
      current = '';
    }
    current += sentence + ' ';
  }
  if (current.trim()) chunks.push({ content: current.trim(), position: pos });
  return chunks;
}

function getDocType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = { '.pdf': 'pdf', '.md': 'markdown', '.txt': 'text', '.html': 'html', '.htm': 'html' };
  return map[ext] || 'text';
}

// ============ REFERENCES ============
app.get('/api/references', (req, res) => {
  let refs = loadJSON('references.json');
  const { category, style, platform, liked, source, search } = req.query;
  if (category) refs = refs.filter(r => r.category === category);
  if (style) refs = refs.filter(r => r.style === style);
  if (platform) refs = refs.filter(r => r.platform === platform);
  if (source) refs = refs.filter(r => r.source === source);
  if (liked === 'true') refs = refs.filter(r => r.liked);
  if (search) {
    const q = search.toLowerCase();
    refs = refs.filter(r => (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q)));
  }
  refs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(refs);
});

app.get('/api/references/liked', (req, res) => {
  const refs = loadJSON('references.json').filter(r => r.liked);
  res.json(refs);
});

app.get('/api/references/styles', (req, res) => {
  const liked = loadJSON('references.json').filter(r => r.liked);
  const styles = {}, categories = {}, colors = {};
  liked.forEach(r => {
    if (r.style) styles[r.style] = (styles[r.style] || 0) + 1;
    if (r.category) categories[r.category] = (categories[r.category] || 0) + 1;
    (r.colorPalette || []).forEach(c => { colors[c] = (colors[c] || 0) + 1; });
  });
  res.json({ totalLiked: liked.length, styles, categories, colors });
});

app.post('/api/references', (req, res) => {
  const refs = loadJSON('references.json');
  const ref = {
    id: genId(),
    title: req.body.title || 'Untitled',
    url: req.body.url || '',
    imageUrl: req.body.imageUrl || '',
    description: req.body.description || '',
    source: req.body.source || 'custom',
    platform: req.body.platform || 'web',
    category: req.body.category || 'landing-page',
    tags: req.body.tags || [],
    liked: req.body.liked || false,
    style: req.body.style || 'minimal',
    colorPalette: req.body.colorPalette || [],
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };
  refs.push(ref);
  saveJSON('references.json', refs);
  res.json(ref);
});

app.put('/api/references/:id', (req, res) => {
  const refs = loadJSON('references.json');
  const idx = refs.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  refs[idx] = { ...refs[idx], ...req.body, id: refs[idx].id, createdAt: refs[idx].createdAt };
  saveJSON('references.json', refs);
  res.json(refs[idx]);
});

app.delete('/api/references/:id', (req, res) => {
  let refs = loadJSON('references.json');
  refs = refs.filter(r => r.id !== req.params.id);
  saveJSON('references.json', refs);
  res.json({ ok: true });
});

// ============ DESIGN SYSTEM ============
app.get('/api/design-system', (req, res) => {
  const ds = loadJSON('design-system.json', {
    colors: [], typography: [], spacing: { base: 8, scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] },
    borderRadius: '8px', shadows: [], components: [], principles: [],
    gridSystem: '12-column', breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
  });
  res.json(ds);
});

app.put('/api/design-system', (req, res) => {
  saveJSON('design-system.json', req.body);
  res.json(req.body);
});

app.post('/api/design-system/extract', (req, res) => {
  // Placeholder — extraction would use Figma API with stored token
  const { figmaUrl, notes } = req.body;
  const ds = loadJSON('design-system.json', {
    colors: [], typography: [], spacing: { base: 8, scale: [] },
    borderRadius: '8px', shadows: [], components: [], principles: [],
    gridSystem: '12-column', breakpoints: {}
  });
  if (notes) {
    // Manual entry from notes
    ds.extractionNotes = notes;
    ds.extractedFrom = figmaUrl || '';
    ds.extractedAt = new Date().toISOString();
  }
  saveJSON('design-system.json', ds);
  res.json({ message: 'Design system updated. Use Figma MCP for full extraction.', designSystem: ds });
});

// ============ KNOWLEDGE BASE (RAG) ============
app.get('/api/documents', (req, res) => {
  const docs = loadJSON('documents.json');
  res.json(docs);
});

app.get('/api/documents/:id', (req, res) => {
  const docs = loadJSON('documents.json');
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const chunks = loadJSON('chunks.json').filter(c => c.docId === doc.id);
  res.json({ ...doc, chunks });
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const text = await extractText(req.file.path, req.file.mimetype, req.file.originalname);
    const chunks = chunkText(text);
    const docId = genId();
    const doc = {
      id: docId,
      name: req.body.name || req.file.originalname,
      filename: req.file.filename,
      type: getDocType(req.file.originalname),
      category: req.body.category || 'brand-guidelines',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString(),
      size: req.file.size
    };
    const docs = loadJSON('documents.json');
    docs.push(doc);
    saveJSON('documents.json', docs);
    const allChunks = loadJSON('chunks.json');
    chunks.forEach(c => allChunks.push({ ...c, id: genId(), docId }));
    saveJSON('chunks.json', allChunks);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  let docs = loadJSON('documents.json');
  const doc = docs.find(d => d.id === req.params.id);
  if (doc) {
    const filePath = path.join(DATA_DIR, 'uploads', doc.filename);
    fs.removeSync(filePath);
  }
  docs = docs.filter(d => d.id !== req.params.id);
  saveJSON('documents.json', docs);
  let chunks = loadJSON('chunks.json');
  chunks = chunks.filter(c => c.docId !== req.params.id);
  saveJSON('chunks.json', chunks);
  res.json({ ok: true });
});

app.get('/api/search', (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.json([]);
  const chunks = loadJSON('chunks.json');
  const results = bm25Search(q, chunks, parseInt(limit) || 10);
  const docs = loadJSON('documents.json');
  const enriched = results.map(r => {
    const doc = docs.find(d => d.id === r.docId);
    return { ...r, docName: doc ? doc.name : 'Unknown', docCategory: doc ? doc.category : '' };
  });
  res.json(enriched);
});

// ============ REVIEWS ============
app.get('/api/reviews', (req, res) => {
  let reviews = loadJSON('reviews.json');
  const { status, type } = req.query;
  if (status) reviews = reviews.filter(r => r.status === status);
  if (type) reviews = reviews.filter(r => r.type === type);
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const reviews = loadJSON('reviews.json');
  const review = {
    id: genId(),
    title: req.body.title || 'Untitled Review',
    figmaUrl: req.body.figmaUrl || '',
    type: req.body.type || 'audit',
    status: req.body.status || 'open',
    findings: req.body.findings || [],
    score: req.body.score || null,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  saveJSON('reviews.json', reviews);
  res.json(review);
});

app.put('/api/reviews/:id', (req, res) => {
  const reviews = loadJSON('reviews.json');
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  reviews[idx] = { ...reviews[idx], ...req.body, id: reviews[idx].id, createdAt: reviews[idx].createdAt };
  saveJSON('reviews.json', reviews);
  res.json(reviews[idx]);
});

app.delete('/api/reviews/:id', (req, res) => {
  let reviews = loadJSON('reviews.json');
  reviews = reviews.filter(r => r.id !== req.params.id);
  saveJSON('reviews.json', reviews);
  res.json({ ok: true });
});

// ============ PROJECTS ============
app.get('/api/projects', (req, res) => {
  let projects = loadJSON('projects.json');
  const { status } = req.query;
  if (status) projects = projects.filter(p => p.status === status);
  projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const projects = loadJSON('projects.json');
  const project = {
    id: genId(),
    name: req.body.name || 'Untitled Project',
    description: req.body.description || '',
    figmaUrl: req.body.figmaUrl || '',
    status: req.body.status || 'discovery',
    designSystemId: req.body.designSystemId || null,
    references: req.body.references || [],
    reviews: req.body.reviews || [],
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };
  projects.push(project);
  saveJSON('projects.json', projects);
  res.json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const projects = loadJSON('projects.json');
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  projects[idx] = { ...projects[idx], ...req.body, id: projects[idx].id, createdAt: projects[idx].createdAt };
  saveJSON('projects.json', projects);
  res.json(projects[idx]);
});

app.delete('/api/projects/:id', (req, res) => {
  let projects = loadJSON('projects.json');
  projects = projects.filter(p => p.id !== req.params.id);
  saveJSON('projects.json', projects);
  res.json({ ok: true });
});

// ============ CONFIG ============
app.get('/api/config', (req, res) => {
  const config = loadJSON('config.json', {
    figmaToken: '',
    preferredStyles: [],
    brandColors: [],
    typographyPreferences: [],
    mcpEndpoint: 'https://mcp.figma.com/mcp'
  });
  res.json(config);
});

app.put('/api/config', (req, res) => {
  const config = loadJSON('config.json', {});
  const updated = { ...config, ...req.body };
  saveJSON('config.json', updated);
  res.json(updated);
});

// ============ ANALYTICS ============
app.get('/api/analytics', (req, res) => {
  const refs = loadJSON('references.json');
  const reviews = loadJSON('reviews.json');
  const projects = loadJSON('projects.json');
  const docs = loadJSON('documents.json');
  const liked = refs.filter(r => r.liked);

  const styleBreakdown = {};
  liked.forEach(r => { if (r.style) styleBreakdown[r.style] = (styleBreakdown[r.style] || 0) + 1; });

  const categoryBreakdown = {};
  liked.forEach(r => { if (r.category) categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1; });

  const projectsByStatus = {};
  projects.forEach(p => { projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1; });

  const reviewsByStatus = {};
  reviews.forEach(r => { reviewsByStatus[r.status] = (reviewsByStatus[r.status] || 0) + 1; });

  res.json({
    references: { total: refs.length, liked: liked.length },
    reviews: { total: reviews.length, byStatus: reviewsByStatus, avgScore: reviews.filter(r => r.score).reduce((s, r) => s + r.score, 0) / (reviews.filter(r => r.score).length || 1) },
    projects: { total: projects.length, byStatus: projectsByStatus },
    documents: { total: docs.length },
    stylePreferences: { styles: styleBreakdown, categories: categoryBreakdown }
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Design Studio running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
