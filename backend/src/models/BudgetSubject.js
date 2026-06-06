const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

class BudgetSubject {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { project_id, code, name, budget_amount } = data;
      db.run(
        `INSERT INTO budget_subjects (id, project_id, code, name, budget_amount) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, project_id, code, name, budget_amount || 0],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data });
        }
      );
    });
  }

  static findByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM budget_subjects WHERE project_id = ? ORDER BY code`, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM budget_subjects WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static updateUsedAmount(id, amount) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE budget_subjects SET used_amount = used_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [amount, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static updateLockedAmount(id, amount) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE budget_subjects SET locked_amount = locked_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [amount, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static getAvailableBudget(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT budget_amount, used_amount, locked_amount, 
                (budget_amount - used_amount - locked_amount) as available 
         FROM budget_subjects WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.available : 0);
        }
      );
    });
  }
}

module.exports = BudgetSubject;
