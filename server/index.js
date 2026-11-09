require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// The app runs on a home PC behind a Cloudflare Tunnel. cloudflared connects from
// this same machine, so trust only loopback; express then reads the visitor's real
// address from X-Forwarded-For (used by express-rate-limit).
app.set('trust proxy', 'loopback');

// Security headers. This server also serves the website itself, so the policy
// has to allow what index.html loads: Google Fonts and jsQR from jsDelivr.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        mediaSrc: ["'self'", 'blob:'],
      },
    },
  })
);

// Rate limiting — auth routes (strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// Rate limiting — general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api', apiLimiter);

// FRONTEND_URL is the main address (used in email links). ALLOWED_ORIGINS adds
// any others, comma-separated, e.g. the bare domain alongside www.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
  'http://localhost:5173',
  `http://localhost:${PORT}`,
]
  .map(o => (o || '').trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Stripe webhook needs raw body BEFORE express.json() parses it
const billingRoute = require('./routes/billing');
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  billingRoute.webhookHandler
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/corner', require('./routes/corner'));
app.use('/api/pantry', require('./routes/pantry'));
app.use('/api/garden', require('./routes/garden'));
app.use('/api/users', require('./routes/users'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/products', require('./routes/products'));
app.use('/api/shopping-lists', require('./routes/shopping-lists'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/swaps', require('./routes/swaps'));
app.use('/api/digest', require('./routes/digest'));
app.use('/api/plant-guides', require('./routes/plant-guides'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/billing', billingRoute.router);
app.use('/api/export', require('./routes/export'));

const { suggestionsRouter, featureRouter } = require('./routes/suggestions');
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/feature-requests', featureRouter);

app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', name: "Krystle\'s Cottage" }));

// Unknown API paths get a JSON 404 instead of falling through to the website.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// The website: the built client from client/dist, with every other path
// answered by index.html so links straight to a page (e.g. /garden/plots) work.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) next(err);
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

function startCron() {
  const digestRoute = require('./routes/digest');
  const { buildDigestData, buildDigestHtml, weekLabel, makeTransport } = digestRoute;

  cron.schedule(
    '0 8 * * 0',
    async () => {
      console.log('[cron] Running weekly digest');
      try {
        const db = await getDb();
        const groups = await db.all('SELECT id, name FROM groups');
        for (const group of groups) {
          try {
            const data = await buildDigestData(group.id);
            const html = buildDigestHtml(data);
            const subject = group.name + ' Weekly Digest - Week of ' + weekLabel();
            if (!process.env.EMAIL_USER) {
              console.log('[cron] EMAIL_USER not set');
              continue;
            }
            const transport = makeTransport();
            for (const m of data.members) {
              try {
                await transport.sendMail({
                  from: group.name + ' <' + process.env.EMAIL_USER + '>',
                  to: m.email,
                  subject,
                  html,
                });
              } catch (e) {
                console.error('[cron] Failed to send to', m.email, e.message);
              }
            }
            console.log('[cron] Digest sent for group:', group.name);
          } catch (e) {
            console.error('[cron] Digest error for group', group.id, e.message);
          }
        }
      } catch (e) {
        console.error('[cron] Fatal:', e);
      }
    },
    { timezone: 'America/Chicago' }
  );
  console.log('Weekly digest cron scheduled (Sunday 8am CT)');
}

async function start() {
  try {
    await getDb();
    // Listen on this PC only. The public reaches it through the Cloudflare Tunnel,
    // never directly over the home network.
    app.listen(PORT, '127.0.0.1', () => {
      console.log('Server running on http://localhost:' + PORT);
      startCron();
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

start();
