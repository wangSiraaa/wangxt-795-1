const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

class Reimbursement {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const code = 'BX' + Date.now();
      const { project_id, title, applicant, description } = data;
      db.run(
        `INSERT INTO reimbursements (id, project_id, code, title, applicant, description, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
        [id, project_id, code, title, applicant, description],
        function (err) {
          if (err) reject(err);
          else resolve({ id, code, ...data, status: 'draft' });
        }
      );
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT r.*, p.name as project_name FROM reimbursements r 
              LEFT JOIN projects p ON r.project_id = p.id 
              ORDER BY r.created_at DESC`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT r.*, p.name as project_name, p.status as project_status 
              FROM reimbursements r 
              LEFT JOIN projects p ON r.project_id = p.id 
              WHERE r.id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static findByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM reimbursements WHERE project_id = ? ORDER BY created_at DESC`, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static updateStatus(id, status, operator, remark = '') {
    return new Promise((resolve, reject) => {
      db.get(`SELECT status FROM reimbursements WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        const fromStatus = row ? row.status : null;
        
        db.run(
          `UPDATE reimbursements SET status = ?, updated_at = CURRENT_TIMESTAMP 
           ${status === 'submitted' ? ', submit_time = CURRENT_TIMESTAMP' : ''} WHERE id = ?`,
          [status, id],
          function (err) {
            if (err) return reject(err);
            
            const historyId = uuidv4();
            db.run(
              `INSERT INTO status_history (id, reimbursement_id, from_status, to_status, operator, remark)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [historyId, id, fromStatus, status, operator, remark],
              (histErr) => {
                if (histErr) reject(histErr);
                else resolve({ changes: this.changes });
              }
            );
          }
        );
      });
    });
  }

  static update(id, data) {
    return new Promise((resolve, reject) => {
      const { title, description, modification_note, total_amount } = data;
      db.run(
        `UPDATE reimbursements SET title = ?, description = ?, modification_note = ?, 
         total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [title, description, modification_note, total_amount || 0, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }
}

module.exports = Reimbursement;
