/*
  Lightweight backend server for local testing.
  Run: node server.js (ensure dependencies installed: express, better-sqlite3, bcryptjs, jsonwebtoken, cors, dotenv)
*/
import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 18080;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), 'okpi-backend-data.sqlite');

if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new Database(DB_FILE);

// init schema
db.exec(`PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  firstName TEXT,
  lastName TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  managerId INTEGER,
  active INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(managerId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS objectives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  ownerId INTEGER,
  status TEXT DEFAULT 'DRAFT',
  progress INTEGER DEFAULT 0,
  startDate TEXT,
  endDate TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS kpis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  frequency TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
`);

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization?.split(' ');
  if (!auth || auth[0] !== 'Bearer' || !auth[1]) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(auth[1], JWT_SECRET);
    const u = db.prepare('SELECT id, email, firstName, lastName, role, active FROM users WHERE id = ?').get(payload.id);
    if (!u) return res.status(401).json({ message: 'Invalid token user' });
    req.user = u;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

const app = express();
app.use(cors());
app.use(express.json());

// auth routes
app.post('/api/v1/auth/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(email, hashed, firstName || null, lastName || null, role || 'MEMBER');
    const user = { id: info.lastInsertRowid, email, firstName, lastName, role: role || 'MEMBER' };
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(400).json({ message: 'User exists or invalid' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const stmt = db.prepare('SELECT id, email, password, firstName, lastName, role, active FROM users WHERE email = ?');
  const user = stmt.get(email);
  if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  if (!user.active) return res.status(403).json({ message: 'Account inactive' });
  const token = generateToken(user);
  delete user.password;
  res.json({ user, token });
});

// users list (paginated)
app.get('/api/v1/auth/users', authenticate, requireRole('ADMIN','MANAGER'), (req, res) => {
  const page = Number(req.query.page ?? 0);
  const size = Number(req.query.size ?? 10);
  const role = req.query.role;

  const where = [];
  const params = [];
  if (role) { where.push('role = ?'); params.push(role); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM users ${whereSql}`).get(...params).cnt;
  const rows = db.prepare(`SELECT id, email, firstName, lastName, role, active, managerId, createdAt FROM users ${whereSql} ORDER BY id LIMIT ? OFFSET ?`).all(...params, size, page*size);
  res.json({ content: rows, page, size, totalElements: total, totalPages: Math.max(1, Math.ceil(total/size)) });
});

// update user (admin)
app.put('/api/v1/auth/users/:id', authenticate, requireRole('ADMIN'), (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, email, managerId, role, active } = req.body;
  db.prepare('UPDATE users SET firstName = ?, lastName = ?, email = ?, managerId = ?, role = ?, active = ? WHERE id = ?')
    .run(firstName ?? null, lastName ?? null, email ?? null, managerId ?? null, role ?? null, active ?? 1, id);
  const user = db.prepare('SELECT id, email, firstName, lastName, role, active, managerId FROM users WHERE id = ?').get(id);
  res.json(user);
});

// assign manager team
app.put('/api/v1/auth/users/managers/:id/team', authenticate, (req, res) => {
  const managerId = Number(req.params.id);
  const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds.map(Number) : [];

  if (req.user.role !== 'ADMIN' && Number(req.user.id) !== managerId) return res.status(403).json({ message: 'Forbidden' });

  const trx = db.transaction(() => {
    const setStmt = db.prepare('UPDATE users SET managerId = ? WHERE id = ?');
    memberIds.forEach((mId) => setStmt.run(managerId, mId));
    const placeholders = memberIds.length ? `AND id NOT IN (${memberIds.map(() => '?').join(',')})` : '';
    const params = memberIds.length ? [managerId, ...memberIds] : [managerId];
    const unsetSql = `UPDATE users SET managerId = NULL WHERE managerId = ? ${placeholders}`;
    db.prepare(unsetSql).run(...params);
  });

  try { trx(); res.json({ message: 'Team assigned' }); }
  catch (err) { res.status(500).json({ message: 'Failed to assign team' }); }
});

// objectives dashboard
app.get('/api/v1/objectives/dashboard', authenticate, (req, res) => {
  const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
  const rows = db.prepare('SELECT id, title, description, ownerId, status, progress, startDate, endDate FROM objectives').all();
  let filtered = rows;
  if (ownerId !== undefined) filtered = rows.filter(r => Number(r.ownerId) === ownerId);
  const objectiveCount = filtered.length;
  const keyResultCount = 0;
  res.json({ objectiveCount, keyResultCount, objectives: filtered });
});

// kpis
app.get('/api/v1/kpis', authenticate, (req, res) => {
  const rows = db.prepare('SELECT id, name, description, unit, frequency FROM kpis').all();
  res.json(rows);
});

// health
app.get('/health', (req, res) => res.json({ ok: true }));

if (process.argv.includes('--seed')) {
  // seed if requested
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count === 0) {
    const hash = (p) => bcrypt.hashSync(p, 10);
    db.prepare('INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)')
      .run('admin@example.com', hash('password'), 'Admin', 'User', 'ADMIN');
    db.prepare('INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)')
      .run('manager@example.com', hash('password'), 'Manager', 'User', 'MANAGER');
    db.prepare('INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)')
      .run('alice@example.com', hash('password'), 'Alice', 'Member', 'MEMBER');
    db.prepare('INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)')
      .run('bob@example.com', hash('password'), 'Bob', 'Member', 'MEMBER');
    db.prepare('INSERT INTO objectives (title, description, ownerId, status, progress) VALUES (?, ?, ?, ?, ?)')
      .run('Improve onboarding', 'Reduce dropoff', 2, 'ON_TRACK', 70);
    db.prepare('INSERT INTO objectives (title, description, ownerId, status, progress) VALUES (?, ?, ?, ?, ?)')
      .run('Fix churn', 'Retention improvements', 2, 'AT_RISK', 30);
    console.log('Seeded DB');
  } else {
    console.log('DB already seeded');
  }
} else {
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}
