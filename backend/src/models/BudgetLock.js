const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

class BudgetLock {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { reimbursement_id, budget_subject_id, invoice_no, applicant, lock_amount } = data;
      db.run(
        `INSERT INTO budget_locks (id, reimbursement_id, budget_subject_id, invoice_no, applicant, lock_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'locked')`,
        [id, reimbursement_id, budget_subject_id, invoice_no || null, applicant, lock_amount || 0],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data, status: 'locked' });
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM budget_locks WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static findByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT bl.*, bs.name as subject_name, bs.code as subject_code 
              FROM budget_locks bl 
              LEFT JOIN budget_subjects bs ON bl.budget_subject_id = bs.id
              WHERE bl.reimbursement_id = ? 
              ORDER BY bl.created_at DESC`, [reimbursementId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findActiveBySubjectId(subjectId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM budget_locks WHERE budget_subject_id = ? AND status = 'locked'`, [subjectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static release(id, releaseReason) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE budget_locks SET status = 'released', release_reason = ?, released_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [releaseReason || '', id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static releaseByReimbursementId(reimbursementId, releaseReason) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE budget_locks SET status = 'released', release_reason = ?, released_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE reimbursement_id = ? AND status = 'locked'`,
        [releaseReason || '', reimbursementId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static getTotalLockedBySubjectId(subjectId) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT COALESCE(SUM(lock_amount), 0) as total_locked 
              FROM budget_locks 
              WHERE budget_subject_id = ? AND status = 'locked'`, [subjectId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.total_locked : 0);
      });
    });
  }
}

module.exports = BudgetLock;
