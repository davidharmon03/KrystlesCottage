const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'krystles-brand-hub-secret-2024';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function superadminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['admin', 'superadmin'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function twoFaMiddleware(req, res, next) {
  const token = req.headers['x-2fa-token'];
  if (!token) return res.status(403).json({ error: '2FA required', code: '2FA_REQUIRED' });
  try {
    const { getDb } = require('../db');
    const db = await getDb();
    const session = await db.get(
      "SELECT * FROM two_fa_sessions WHERE token = ? AND expires_at > datetime('now')",
      [token]
    );
    if (!session) return res.status(403).json({ error: '2FA session expired', code: '2FA_REQUIRED' });
    next();
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { authMiddleware, superadminMiddleware, twoFaMiddleware, JWT_SECRET };
