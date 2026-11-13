const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { isGroupMember } = require('../utils/access');
const { authMiddleware } = require('../middleware/auth');
const cheerio = require('cheerio');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const { createWorker } = require('tesseract.js');
const { recipeFromText } = require('../utils/recipeFromText');

function parseRecipe(r) {
  return {
    ...r,
    ingredients: JSON.parse(r.ingredients || '[]'),
    steps: JSON.parse(r.steps || '[]'),
    tags: JSON.parse(r.tags || '[]'),
    skill_tags: JSON.parse(r.skill_tags || '[]'),
    sides: r.sides || '',
  };
}

// Whole number in range, or null for blank / nonsense. Servings 1–100;
// times 0–2880 minutes (two days, for long ferments and smokes).
function optInt(v, min, max) {
  if (v === undefined || v === null || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
const optServings = v => optInt(v, 1, 100);
const optMinutes = v => optInt(v, 0, 2880);

// GET /api/recipes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.query;
    const db = await getDb();
    let rows;

    if (groupId) {
      const member = await isGroupMember(groupId, req.user.id);
      if (!member) return res.status(403).json({ error: 'Not a member of this group' });

      rows = await db.all(
        `
        SELECT r.*, u.name AS author_name,
          (SELECT image_path FROM meal_photos WHERE recipe_id = r.id ORDER BY created_at ASC LIMIT 1) AS primary_photo_path
        FROM recipes r JOIN users u ON u.id = r.author_id
        WHERE r.group_id = ? OR r.is_public = 1
        ORDER BY r.created_at DESC
      `,
        [groupId]
      );
    } else {
      rows = await db.all(
        `
        SELECT r.*, u.name AS author_name,
          (SELECT image_path FROM meal_photos WHERE recipe_id = r.id ORDER BY created_at ASC LIMIT 1) AS primary_photo_path
        FROM recipes r JOIN users u ON u.id = r.author_id
        WHERE r.is_public = 1 OR r.author_id = ?
        ORDER BY r.created_at DESC
      `,
        [req.user.id]
      );
    }

    res.json(rows.map(parseRecipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const row = await db.get(
      `
      SELECT r.*, u.name AS author_name
      FROM recipes r JOIN users u ON u.id = r.author_id
      WHERE r.id = ?
    `,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Recipe not found' });
    res.json(parseRecipe(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recipes
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      steps,
      tags,
      skill_tags,
      group_id,
      is_public,
      sides,
      servings,
      prep_time,
      cook_time,
    } = req.body;
    if (!title || !ingredients || !steps)
      return res.status(400).json({ error: 'title, ingredients, and steps are required' });

    const db = await getDb();
    const id = uuidv4();
    await db.run(
      `
      INSERT INTO recipes (id, title, description, ingredients, steps, tags, skill_tags, author_id, group_id, is_public, sides, servings, prep_time, cook_time)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,
      [
        id,
        title,
        description || '',
        JSON.stringify(Array.isArray(ingredients) ? ingredients : [ingredients]),
        JSON.stringify(Array.isArray(steps) ? steps : [steps]),
        JSON.stringify(tags || []),
        JSON.stringify(skill_tags || []),
        req.user.id,
        group_id || null,
        is_public ? 1 : 0,
        sides || '',
        optServings(servings),
        optMinutes(prep_time),
        optMinutes(cook_time),
      ]
    );

    const created = await db.get('SELECT * FROM recipes WHERE id = ?', [id]);
    res.status(201).json(parseRecipe(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/recipes/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const recipe = await db.get('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    if (recipe.author_id !== req.user.id) return res.status(403).json({ error: 'Not your recipe' });

    const {
      title,
      description,
      ingredients,
      steps,
      tags,
      skill_tags,
      is_public,
      sides,
      servings,
      prep_time,
      cook_time,
    } = req.body;
    await db.run(
      `
      UPDATE recipes SET title=?, description=?, ingredients=?, steps=?, tags=?, skill_tags=?, is_public=?, sides=?, servings=?, prep_time=?, cook_time=?
      WHERE id=?
    `,
      [
        title ?? recipe.title,
        description ?? recipe.description,
        JSON.stringify(ingredients ?? JSON.parse(recipe.ingredients)),
        JSON.stringify(steps ?? JSON.parse(recipe.steps)),
        JSON.stringify(tags ?? JSON.parse(recipe.tags)),
        JSON.stringify(skill_tags ?? JSON.parse(recipe.skill_tags)),
        is_public !== undefined ? (is_public ? 1 : 0) : recipe.is_public,
        sides !== undefined ? sides : recipe.sides || '',
        servings !== undefined ? optServings(servings) : recipe.servings,
        prep_time !== undefined ? optMinutes(prep_time) : recipe.prep_time,
        cook_time !== undefined ? optMinutes(cook_time) : recipe.cook_time,
        req.params.id,
      ]
    );

    const updated = await db.get('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    res.json(parseRecipe(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recipes/:id/add-to-list
router.post('/:id/add-to-list', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const recipe = await db.get('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const { list_id, group_id, multiplier = 1 } = req.body;
    if (!list_id || !group_id)
      return res.status(400).json({ error: 'list_id and group_id required' });

    const member = await isGroupMember(group_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a group member' });

    const list = await db.get('SELECT * FROM shopping_lists WHERE id = ? AND group_id = ?', [
      list_id,
      group_id,
    ]);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const ingredients = JSON.parse(recipe.ingredients || '[]');
    const products = await db.all('SELECT * FROM products WHERE is_public = 1');

    function matchProduct(ing) {
      const ingLower = ing.toLowerCase();
      const sorted = [...products].sort((a, b) => b.name.length - a.name.length);
      for (const p of sorted) {
        if (ingLower.includes(p.name.toLowerCase())) return p;
      }
      return null;
    }

    const mult = Math.max(1, parseInt(multiplier) || 1);
    const added = [];

    for (const ing of ingredients) {
      const matched = matchProduct(ing);
      const id = uuidv4();
      const name = matched ? matched.name : ing;
      const product_id = matched ? matched.id : null;
      const store_section = matched ? matched.store_section : 'other';
      const category = matched ? matched.category : 'other';
      const quantity = mult > 1 ? `x${mult}` : '';

      await db.run(
        `INSERT INTO shopping_list_items
           (id, group_id, list_id, name, product_id, quantity, store_section, category, is_checked, added_by)
         VALUES (?,?,?,?,?,?,?,?,0,?)`,
        [id, group_id, list_id, name, product_id, quantity, store_section, category, req.user.id]
      );
      added.push({ name, matched: !!matched, store_section });
    }

    res.json({ added, list_id, multiplier: mult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const recipe = await db.get('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    if (recipe.author_id !== req.user.id) return res.status(403).json({ error: 'Not your recipe' });
    await db.run('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Parse ISO 8601 duration string → total minutes (e.g. "PT1H30M" → 90)
function parseDuration(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return parseInt(m[1] || 0) * 60 + parseInt(m[2] || 0) + Math.round(parseInt(m[3] || 0) / 60);
}

// Extract image URL from schema.org image field (string | array | {url})
function extractImage(img) {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) {
    const first = img[0];
    return typeof first === 'string' ? first : first?.url || '';
  }
  return img.url || '';
}

// Walk a JSON-LD object/graph looking for a Recipe node
function findRecipeNode(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const type = obj['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return obj;
  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
  }
  return null;
}

// POST /api/recipes/import-url
// Fetch a recipe page, parse schema.org/Recipe JSON-LD, return data for user preview (does NOT save)
router.post('/import-url', authMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // ── 1. Fetch the page ──────────────────────────────────────────────────────
  let html;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    clearTimeout(timer);

    if (response.status === 403 || response.status === 401) {
      return res.status(400).json({
        error: 'This site blocked our request. You can copy the recipe manually instead.',
      });
    }
    if (!response.ok) {
      return res.status(400).json({
        error: `We couldn't read that page (HTTP ${response.status}). Try copying the recipe manually.`,
      });
    }
    html = await response.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      return res
        .status(400)
        .json({ error: 'The site took too long to respond (timeout after 10 s).' });
    }
    return res.status(400).json({
      error: "We couldn't read that page. Try copying the recipe manually.",
    });
  }

  // ── 2. Parse HTML with cheerio ─────────────────────────────────────────────
  const $ = cheerio.load(html);

  // ── 3. Find JSON-LD Recipe node ────────────────────────────────────────────
  let recipeNode = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipeNode) return;
    try {
      const json = JSON.parse($(el).html());
      recipeNode = findRecipeNode(json);
    } catch {
      /* malformed JSON-LD — skip */
    }
  });

  // ── 4. Build response from JSON-LD ─────────────────────────────────────────
  if (recipeNode) {
    // Ingredients
    const ingredients = (recipeNode.recipeIngredient || [])
      .map(i => (typeof i === 'string' ? i : String(i)).trim())
      .filter(Boolean);

    // Steps — handle string[], HowToStep[], or bare string
    let steps = [];
    const instr = recipeNode.recipeInstructions;
    if (Array.isArray(instr)) {
      steps = instr
        .map(s => (typeof s === 'string' ? s : s.text || s.name || '').trim())
        .filter(Boolean);
    } else if (typeof instr === 'string' && instr.trim()) {
      steps = [instr.trim()];
    }

    // Servings
    let servings = '';
    const yld = recipeNode.recipeYield;
    if (yld) {
      const raw = Array.isArray(yld) ? String(yld[0]) : String(yld);
      servings = (raw.match(/\d+/) || [''])[0]; // "Serves 4-6" → 4
    }

    // Tags — recipeCategory + keywords
    const rawTags = [];
    if (recipeNode.recipeCategory) {
      const cats = Array.isArray(recipeNode.recipeCategory)
        ? recipeNode.recipeCategory
        : [recipeNode.recipeCategory];
      rawTags.push(...cats);
    }
    if (recipeNode.keywords) {
      const kws =
        typeof recipeNode.keywords === 'string'
          ? recipeNode.keywords.split(',')
          : Array.isArray(recipeNode.keywords)
            ? recipeNode.keywords
            : [];
      rawTags.push(...kws);
    }
    const tags = [...new Set(rawTags.map(t => t.trim().toLowerCase()).filter(Boolean))].slice(0, 6);

    return res.json({
      title: recipeNode.name || 'Untitled Recipe',
      description: recipeNode.description || '',
      ingredients,
      steps,
      servings,
      prepTime: parseDuration(recipeNode.prepTime),
      cookTime: parseDuration(recipeNode.cookTime),
      imageUrl: extractImage(recipeNode.image),
      tags,
      skill_tags: [],
      sides: '',
      is_public: false,
      source_url: url,
    });
  }

  // ── 5. OG fallback — return partial data rather than nothing ───────────────
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const ogDesc =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  if (ogTitle) {
    return res.json({
      title: ogTitle.trim(),
      description: ogDesc.trim(),
      ingredients: [],
      steps: [],
      servings: '',
      prepTime: null,
      cookTime: null,
      imageUrl: ogImage,
      tags: [],
      skill_tags: [],
      sides: '',
      is_public: false,
      source_url: url,
      _partial: true, // signal to client that fields need manual fill-in
    });
  }

  return res.status(400).json({
    error:
      "We couldn't find recipe data on that page. Try a different URL or copy the recipe manually.",
  });
});

// POST /api/recipes/import-photo
// Read the text off a photo of a printed recipe (free, on this PC — no cloud),
// best-guess it into fields, return for user preview (does NOT save).
const photoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many photos at once — please wait a few minutes and try again.' },
});
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Please use a JPG, PNG or WebP photo.'), false);
  },
}).single('image');

// One photo at a time — reading text is heavy work for the PC
let ocrBusy = Promise.resolve();

async function readText(buffer) {
  const img = await sharp(buffer)
    .rotate() // honour phone orientation
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
  const worker = await createWorker('eng', 1, {
    langPath: path.join(path.dirname(require.resolve('@tesseract.js-data/eng')), '4.0.0_best_int'),
    gzip: true,
    cacheMethod: 'none',
  });
  try {
    const { data } = await worker.recognize(img);
    return { text: data.text || '', confidence: data.confidence || 0 };
  } finally {
    await worker.terminate();
  }
}

router.post('/import-photo', photoLimiter, authMiddleware, (req, res) => {
  photoUpload(req, res, async uploadErr => {
    if (uploadErr) {
      const msg =
        uploadErr.code === 'LIMIT_FILE_SIZE'
          ? 'That photo is too large (10 MB max).'
          : uploadErr.message || 'Upload failed';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'Please choose a photo.' });

    try {
      const job = ocrBusy.then(() => readText(req.file.buffer));
      ocrBusy = job.catch(() => {});
      const { text, confidence } = await job;

      if (text.replace(/[^a-z]/gi, '').length < 20) {
        return res.status(400).json({
          error:
            "We couldn't read any words in that photo. Try again with the page flat, in good light, taken straight on.",
        });
      }

      const r = recipeFromText(text);
      res.json({
        ...r,
        title: r.title || 'Untitled Recipe',
        imageUrl: '',
        tags: [],
        skill_tags: [],
        sides: '',
        is_public: false,
        source_url: '',
        _photo: true,
        _lowConfidence: confidence < 60,
        _partial: r.ingredients.length === 0 || r.steps.length === 0,
      });
    } catch (err) {
      console.error('import-photo:', err);
      res.status(500).json({ error: 'Something went wrong reading that photo. Please try again.' });
    }
  });
});

module.exports = router;
