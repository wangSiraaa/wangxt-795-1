const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

class ReimbursementItem {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { reimbursement_id, budget_subject_id, subject_name, amount, description } = data;
      db.run(
        `INSERT INTO reimbursement_items (id, reimbursement_id, budget_subject_id, subject_name, amount, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, reimbursement_id, budget_subject_id, subject_name, amount, description],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data });
        }
      );
    });
  }

  static findByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM reimbursement_items WHERE reimbursement_id = ?`, [reimbursementId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static deleteByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM reimbursement_items WHERE reimbursement_id = ?`, [reimbursementId], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

class Invoice {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { reimbursement_id, invoice_no, invoice_code, amount, invoice_date, vendor, file_name, file_path } = data;
      db.run(
        `INSERT INTO invoices (id, reimbursement_id, invoice_no, invoice_code, amount, invoice_date, vendor, file_name, file_path) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, reimbursement_id, invoice_no, invoice_code, amount, invoice_date, vendor, file_name, file_path],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data });
        }
      );
    });
  }

  static findByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM invoices WHERE reimbursement_id = ?`, [reimbursementId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findByInvoiceNo(invoiceNo) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM invoices WHERE invoice_no = ?`, [invoiceNo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM invoices WHERE id = ?`, [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

class PreReview {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { reimbursement_id, reviewer, result, opinion } = data;
      db.run(
        `INSERT INTO pre_reviews (id, reimbursement_id, reviewer, result, opinion) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, reimbursement_id, reviewer, result, opinion],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data });
        }
      );
    });
  }

  static findByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM pre_reviews WHERE reimbursement_id = ? ORDER BY reviewed_at DESC`, [reimbursementId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

class Confirmation {
  static create(data) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { reimbursement_id, confirmer, subject_id, over_amount, result, opinion } = data;
      db.run(
        `INSERT INTO confirmations (id, reimbursement_id, confirmer, subject_id, over_amount, result, opinion) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, reimbursement_id, confirmer, subject_id, over_amount, result, opinion],
        function (err) {
          if (err) reject(err);
          else resolve({ id, ...data });
        }
      );
    });
  }

  static findByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT c.*, bs.name as subject_name FROM confirmations c 
              LEFT JOIN budget_subjects bs ON c.subject_id = bs.id
              WHERE c.reimbursement_id = ? ORDER BY confirmed_at DESC`, [reimbursementId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

class StatusHistory {
  static findByReimbursementId(reimbursementId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM status_history WHERE reimbursement_id = ? ORDER BY created_at DESC`, [reimbursementId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = { ReimbursementItem, Invoice, PreReview, Confirmation, StatusHistory };
