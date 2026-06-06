const express = require('express');
const router = express.Router();
const Reimbursement = require('../models/Reimbursement');
const BudgetSubject = require('../models/BudgetSubject');
const BudgetLock = require('../models/BudgetLock');
const BusinessRules = require('../rules/businessRules');
const { ReimbursementItem, Invoice, PreReview, Confirmation, StatusHistory } = require('../models/OtherModels');

router.get('/', async (req, res) => {
  try {
    const reimbursements = await Reimbursement.findAll();
    res.json({ success: true, data: reimbursements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: '报销单不存在' });
    }
    const items = await ReimbursementItem.findByReimbursementId(req.params.id);
    const invoices = await Invoice.findByReimbursementId(req.params.id);
    const preReviews = await PreReview.findByReimbursementId(req.params.id);
    const confirmations = await Confirmation.findByReimbursementId(req.params.id);
    const history = await StatusHistory.findByReimbursementId(req.params.id);
    const budgetLocks = await BudgetLock.findByReimbursementId(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...reimbursement,
        items,
        invoices,
        preReviews,
        confirmations,
        history,
        budget_locks: budgetLocks
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const projectCheck = await BusinessRules.checkProjectClosed(req.body.project_id);
    if (!projectCheck.valid) {
      return res.status(400).json({ success: false, message: projectCheck.message });
    }
    
    const reimbursement = await Reimbursement.create(req.body);
    res.json({ success: true, data: reimbursement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: '报销单不存在' });
    }
    
    const projectCheck = await BusinessRules.checkProjectClosed(reimbursement.project_id);
    if (!projectCheck.valid) {
      return res.status(400).json({ success: false, message: projectCheck.message });
    }
    
    if (req.body.items) {
      await ReimbursementItem.deleteByReimbursementId(req.params.id);
      let totalAmount = 0;
      for (const item of req.body.items) {
        await ReimbursementItem.create({
          reimbursement_id: req.params.id,
          ...item
        });
        totalAmount += item.amount || 0;
      }
      req.body.total_amount = totalAmount;
    }
    
    await Reimbursement.update(req.params.id, req.body);
    const updated = await Reimbursement.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const { modification_note, operator } = req.body;
    
    const validation = await BusinessRules.validateSubmit(req.params.id, modification_note);
    
    if (!validation.valid) {
      if (validation.needConfirmation) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          needConfirmation: true,
          overBudgetItems: validation.overBudgetItems
        });
      }
      return res.status(400).json({ success: false, message: validation.message });
    }
    
    await Reimbursement.updateStatus(req.params.id, 'pre_reviewing', operator || 'system', '提交送审');
    const updated = await Reimbursement.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/pre-review', async (req, res) => {
  try {
    const { reviewer, result, opinion } = req.body;
    
    await PreReview.create({
      reimbursement_id: req.params.id,
      reviewer,
      result,
      opinion
    });
    
    const reimbursement = await Reimbursement.findById(req.params.id);
    
    if (result === 'pass') {
      const items = await ReimbursementItem.findByReimbursementId(req.params.id);
      const invoices = await Invoice.findByReimbursementId(req.params.id);
      
      for (const item of items) {
        const invoiceNo = invoices.length > 0 ? invoices.map(i => i.invoice_no).join(', ') : null;
        
        await BudgetLock.create({
          reimbursement_id: req.params.id,
          budget_subject_id: item.budget_subject_id,
          invoice_no: invoiceNo,
          applicant: reimbursement.applicant,
          lock_amount: item.amount
        });
        
        await BudgetSubject.updateLockedAmount(item.budget_subject_id, item.amount);
      }
      
      await Reimbursement.updateStatus(req.params.id, 'pending_confirmation', reviewer, opinion || '预审通过，待领导确认');
    } else {
      await Reimbursement.updateStatus(req.params.id, 'rejected', reviewer, opinion || '预审不通过');
    }
    
    const updated = await Reimbursement.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/confirm', async (req, res) => {
  try {
    const { confirmer, subject_id, over_amount, result, opinion, operator } = req.body;
    
    await Confirmation.create({
      reimbursement_id: req.params.id,
      confirmer,
      subject_id,
      over_amount,
      result,
      opinion
    });
    
    if (result === 'approved') {
      const confirmations = await Confirmation.findByReimbursementId(req.params.id);
      const allApproved = confirmations.every(c => c.result === 'approved');
      
      if (allApproved) {
        const items = await ReimbursementItem.findByReimbursementId(req.params.id);
        
        for (const item of items) {
          await BudgetSubject.updateUsedAmount(item.budget_subject_id, item.amount);
          await BudgetSubject.updateLockedAmount(item.budget_subject_id, -item.amount);
        }
        
        await BudgetLock.releaseByReimbursementId(req.params.id, '领导确认通过，锁定释放');
        
        await Reimbursement.updateStatus(req.params.id, 'pre_reviewed', operator || 'system', '领导确认通过');
      }
    } else {
      const items = await ReimbursementItem.findByReimbursementId(req.params.id);
      
      for (const item of items) {
        await BudgetSubject.updateLockedAmount(item.budget_subject_id, -item.amount);
      }
      
      await BudgetLock.releaseByReimbursementId(req.params.id, '领导确认不通过，锁定释放');
      
      await Reimbursement.updateStatus(req.params.id, 'rejected', operator || 'system', '领导确认不通过');
    }
    
    const updated = await Reimbursement.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
