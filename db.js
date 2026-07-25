const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'resume_tailor.db');
let db;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      original_resume TEXT NOT NULL,
      job_description TEXT NOT NULL,
      original_score INTEGER,
      optimized_score INTEGER,
      missing_keywords TEXT,
      optimized_resume TEXT,
      executive_summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  saveDb();
  return db;
}

function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

module.exports = {
  initDb,

  createUser(name, email, passwordHash) {
    const id = uuidv4();
    db.run(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, name, email.toLowerCase(), passwordHash]
    );
    saveDb();
    return { id, name, email: email.toLowerCase() };
  },

  findUserByEmail(email) {
    return getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  },

  findUserById(id) {
    return getOne('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
  },

  saveAnalysis(userId, originalResume, jobDesc, analysisData) {
    const id = uuidv4();
    const missingKwStr = JSON.stringify(analysisData.missing_keywords || []);

    db.run(`
      INSERT INTO resume_analyses (id, user_id, original_resume, job_description, original_score, optimized_score, missing_keywords, optimized_resume, executive_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      userId || null,
      originalResume,
      jobDesc,
      analysisData.original_score || 0,
      analysisData.optimized_score || 0,
      missingKwStr,
      analysisData.optimized_resume || '',
      analysisData.executive_summary || ''
    ]);

    saveDb();
    return { id, ...analysisData };
  },

  getUserHistory(userId) {
    const sql = userId
      ? 'SELECT * FROM resume_analyses WHERE user_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM resume_analyses ORDER BY created_at DESC LIMIT 20';
    const rows = getAll(sql, userId ? [userId] : []);

    return rows.map(r => ({
      ...r,
      missing_keywords: r.missing_keywords ? JSON.parse(r.missing_keywords) : []
    }));
  },

  deleteAnalysis(id, userId) {
    if (userId) {
      db.run('DELETE FROM resume_analyses WHERE id = ? AND user_id = ?', [id, userId]);
    } else {
      db.run('DELETE FROM resume_analyses WHERE id = ?', [id]);
    }
    saveDb();
  }
};
