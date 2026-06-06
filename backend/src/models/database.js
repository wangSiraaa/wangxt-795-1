const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'research_expense.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    principal TEXT NOT NULL,
    department TEXT NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS budget_subjects (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    budget_amount REAL NOT NULL DEFAULT 0,
    used_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reimbursements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    applicant TEXT NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    description TEXT,
    modification_note TEXT,
    submit_time TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reimbursement_items (
    id TEXT PRIMARY KEY,
    reimbursement_id TEXT NOT NULL,
    budget_subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id),
    FOREIGN KEY (budget_subject_id) REFERENCES budget_subjects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    reimbursement_id TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    invoice_code TEXT,
    amount REAL NOT NULL,
    invoice_date TEXT,
    vendor TEXT,
    file_name TEXT,
    file_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pre_reviews (
    id TEXT PRIMARY KEY,
    reimbursement_id TEXT NOT NULL,
    reviewer TEXT NOT NULL,
    result TEXT NOT NULL,
    opinion TEXT,
    reviewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS confirmations (
    id TEXT PRIMARY KEY,
    reimbursement_id TEXT NOT NULL,
    confirmer TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    over_amount REAL NOT NULL,
    result TEXT NOT NULL,
    opinion TEXT,
    confirmed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id),
    FOREIGN KEY (subject_id) REFERENCES budget_subjects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS status_history (
    id TEXT PRIMARY KEY,
    reimbursement_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    operator TEXT NOT NULL,
    remark TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id)
  )`);

  console.log('数据库表创建完成');
});

module.exports = db;
