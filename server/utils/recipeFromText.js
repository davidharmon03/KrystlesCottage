// Turn the raw text read off a recipe photo into { title, description,
// ingredients, steps, servings, prepTime, cookTime }. Best guess only — the
// user always reviews it before saving.

const ING_HEAD = /^\s*(ingredients?|you will need|you'll need|what you need)\b[:\s]*$/i;
const STEP_HEAD =
  /^\s*(directions?|instructions?|method|preparation|steps|how to make it|to make)\b[:\s]*$/i;
const STEP_NUM = /^\s*(?:step\s*)?(\d{1,2})\s*[.):]\s*/i;
const QTY_START =
  /^\s*(?:[-•*·]\s*)?(?:\d|[½⅓⅔¼¾⅛⅜⅝⅞]|one\b|two\b|three\b|four\b|a\s+(?:pinch|dash|handful|few)\b|pinch\b|dash\b|salt\b|freshly\b)/i;
const UNIT =
  /\b(cups?|c\.|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|quarts?|pints?|cloves?|cans?|sticks?|pinch|dash|slices?|large|medium|small|whole)\b/i;

const clean = s =>
  s
    .replace(/[|¦]/g, 'l') // common misread
    .replace(/\s+/g, ' ')
    .trim();

function looksLikeIngredient(line) {
  if (line.length > 90) return false;
  return QTY_START.test(line) || (UNIT.test(line) && line.split(' ').length <= 10);
}

function parseMinutes(text, label) {
  const re = new RegExp(
    `${label}[a-z]*\\s*(?:time)?\\s*[:\\-]?\\s*(\\d+)\\s*(hours?|hrs?|h|minutes?|mins?|m)?(?:\\s*(\\d+)\\s*(?:minutes?|mins?|m))?`,
    'i'
  );
  const m = text.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  if (/^h/i.test(m[2] || '')) return n * 60 + (m[3] ? Number(m[3]) : 0);
  return n;
}

// Fix the usual misreads in an ingredient line: "Ibs" → "lbs", "15 0z" → "15 oz",
// "1large" → "1 large", "1(28" → "1 (28".
const fixIngredient = l =>
  l
    .replace(/\bIb(s?)\b/g, 'lb$1')
    .replace(/(\d)\s*0z\b/g, '$1 oz')
    .replace(/(\d)\s+0[2z]\b/g, '$1 oz') // "15 02" is "15 oz" misread
    .replace(/(\d)(?=[a-zA-Z(])/g, '$1 ');

// Join wrapped lines. A new item starts at a step number, a bullet, or (for
// ingredients) a line that starts with a quantity. A blank line also starts a
// new item, unless keepAcrossBlank says the next line is a continuation.
function group(lines, isStart, keepAcrossBlank = () => false) {
  const out = [];
  let cur = '';
  let afterBlank = false;
  for (const raw of lines) {
    if (raw === '') {
      afterBlank = true;
      continue;
    }
    if (afterBlank && cur && !keepAcrossBlank(raw)) {
      out.push(cur);
      cur = '';
    }
    afterBlank = false;
    if (!cur || isStart(raw)) {
      if (cur) out.push(cur);
      cur = raw;
    } else {
      cur = cur.replace(/-$/, '') + (cur.endsWith('-') ? '' : ' ') + raw;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function recipeFromText(rawText) {
  const text = String(rawText || '').replace(/\r/g, '');
  const lines = text.split('\n').map(clean);
  // Collapse runs of blank lines to one
  const tidy = lines
    .map(l => (/^\d{1,4}$/.test(l) ? '' : l)) // drop bare page numbers
    .filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== ''));

  const ingIdx = tidy.findIndex(l => ING_HEAD.test(l));
  const stepIdx = tidy.findIndex((l, i) => i > ingIdx && STEP_HEAD.test(l));

  // ── Title + description: what comes before the ingredients ───────────────
  const firstIng = tidy.findIndex(l => l && looksLikeIngredient(l));
  const headEnd = ingIdx >= 0 ? ingIdx : firstIng >= 0 ? firstIng : 1;
  const head = tidy.slice(0, headEnd).filter(Boolean);
  const isNoise = l =>
    /^\d+$/.test(l) || // page number
    /^(serves|makes|yield|prep|cook|total)\b/i.test(l) ||
    l.replace(/[^a-z]/gi, '').length < 3;
  const titleLine = head.find(l => !isNoise(l) && l.length <= 80) || '';
  const description = head
    .filter(l => l !== titleLine && !isNoise(l))
    .join(' ')
    .slice(0, 600);

  // ── Ingredients and steps ────────────────────────────────────────────────
  let ingLines;
  let stepLines;
  if (ingIdx >= 0 && stepIdx > ingIdx) {
    ingLines = tidy.slice(ingIdx + 1, stepIdx);
    stepLines = tidy.slice(stepIdx + 1);
  } else if (ingIdx >= 0) {
    // No "Directions" heading: ingredients run until the first long line
    const rest = tidy.slice(ingIdx + 1);
    const firstStep = rest.findIndex(l => l && !looksLikeIngredient(l) && l.length > 60);
    ingLines = firstStep >= 0 ? rest.slice(0, firstStep) : rest;
    stepLines = firstStep >= 0 ? rest.slice(firstStep) : [];
  } else {
    // No headings at all: sort lines by shape
    const body = tidy.slice(headEnd);
    ingLines = body.filter(l => l === '' || looksLikeIngredient(l));
    stepLines = body.filter(l => l === '' || !looksLikeIngredient(l));
  }

  const ingredients = group(
    ingLines,
    l => looksLikeIngredient(l) || /^[-•*·]/.test(l),
    l => /^[a-z]/.test(l) // "rinsed" on its own line belongs to the line above
  )
    .map(l => fixIngredient(l.replace(/^[-•*·]\s*/, '')))
    .filter(l => l.replace(/[^a-z]/gi, '').length >= 2);

  const steps = group(
    stepLines,
    l => STEP_NUM.test(l),
    l => /^[a-z]/.test(l)
  )
    .map(l => l.replace(STEP_NUM, '').trim())
    .filter(l => l.replace(/[^a-z]/gi, '').length >= 4);

  const servingsMatch = text.match(/\b(?:serves|servings?|makes|yield[s]?)\s*[:\-]?\s*(\d+)/i);

  return {
    title: titleLine,
    description,
    ingredients,
    steps,
    servings: servingsMatch ? servingsMatch[1] : '',
    prepTime: parseMinutes(text, 'prep'),
    cookTime: parseMinutes(text, '(?:cook|bake)'),
  };
}

module.exports = { recipeFromText };
