const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Invoice } = require('../models/OtherModels');
const Reimbursement = require('../models/Reimbursement');
const BusinessRules = require('../rules/businessRules');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/:reimbursementId', upload.single('file'), async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.reimbursementId);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: '报销单不存在' });
    }

    const projectCheck = await BusinessRules.checkProjectClosed(reimbursement.project_id);
    if (!projectCheck.valid) {
      return res.status(400).json({ success: false, message: projectCheck.message });
    }

    const { invoice_no, invoice_code, amount, invoice_date, vendor } = req.body;
    
    const duplicateCheck = await BusinessRules.checkInvoiceDuplicate(invoice_no, req.params.reimbursementId);
    if (!duplicateCheck.valid) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: duplicateCheck.message });
    }

    const invoice = await Invoice.create({
      reimbursement_id: req.params.reimbursementId,
      invoice_no,
      invoice_code,
      amount: parseFloat(amount),
      invoice_date,
      vendor,
      file_name: req.file ? req.file.originalname : null,
      file_path: req.file ? req.file.filename : null
    });

    res.json({ success: true, data: invoice });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:reimbursementId', async (req, res) => {
  try {
    const invoices = await Invoice.findByReimbursementId(req.params.reimbursementId);
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Invoice.delete(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ success: false, message: '文件不存在' });
  }
});

module.exports = router;
