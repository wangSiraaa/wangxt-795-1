const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

class Project {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { code, name, principal, department, total_amount, start_date, end_date } = data;
      db.run(
        `INSERT INTO projects (id, code, name, principal, department, total_amount, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, code, name, principal, department, total_amount || 0, start_date, end_date],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data });
        }
      );
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM projects ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM projects WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }
}

module.exports = Project;
