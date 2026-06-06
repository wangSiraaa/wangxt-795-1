const { Invoice } = require('../models/OtherModels');
const BudgetSubject = require('../models/BudgetSubject');
const Project = require('../models/Project');
const Reimbursement = require('../models/Reimbursement');
const { StatusHistory } = require('../models/OtherModels');

class BusinessRules {
  static async checkProjectClosed(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      return { valid: false, message: '课题不存在' };
    }
    if (project.status === 'closed') {
      return { valid: false, message: '课题已结题，只能查看不能新增操作' };
    }
    return { valid: true };
  }

  static async checkInvoicesExist(reimbursementId) {
    const invoices = await Invoice.findByReimbursementId(reimbursementId);
    if (!invoices || invoices.length === 0) {
      return { valid: false, message: '票据缺失，不能送审，请先上传票据附件' };
    }
    return { valid: true };
  }

  static async checkInvoiceDuplicate(invoiceNo, excludeReimbursementId = null) {
    const invoices = await Invoice.findByInvoiceNo(invoiceNo);
    if (excludeReimbursementId) {
      const filtered = invoices.filter(inv => inv.reimbursement_id !== excludeReimbursementId);
      if (filtered.length > 0) {
        return { valid: false, message: `发票号 ${invoiceNo} 已存在，同一张发票号不能重复报销` };
      }
    } else {
      if (invoices.length > 0) {
        return { valid: false, message: `发票号 ${invoiceNo} 已存在，同一张发票号不能重复报销` };
      }
    }
    return { valid: true };
  }

  static async checkBudgetExceed(reimbursementId) {
    const { ReimbursementItem } = require('../models/OtherModels');
    const BudgetLock = require('../models/BudgetLock');
    const items = await ReimbursementItem.findByReimbursementId(reimbursementId);
    
    const overBudgetItems = [];
    
    for (const item of items) {
      const subject = await BudgetSubject.findById(item.budget_subject_id);
      if (subject) {
        const totalLocked = await BudgetLock.getTotalLockedBySubjectId(item.budget_subject_id);
        const available = subject.budget_amount - subject.used_amount - totalLocked;
        if (item.amount > available) {
          overBudgetItems.push({
            subject_id: subject.id,
            subject_name: subject.name,
            budget_amount: subject.budget_amount,
            used_amount: subject.used_amount,
            locked_amount: totalLocked,
            remaining: available,
            requested: item.amount,
            over_amount: item.amount - available
          });
        }
      }
    }
    
    if (overBudgetItems.length > 0) {
      return {
        valid: false,
        message: '存在超预算科目，需项目负责人确认',
        overBudgetItems
      };
    }
    return { valid: true };
  }

  static async checkModificationNote(reimbursementId, modificationNote) {
    const history = await StatusHistory.findByReimbursementId(reimbursementId);
    const hasRejected = history.some(h => h.from_status === 'pre_reviewing' && h.to_status === 'rejected');
    
    if (hasRejected) {
      if (!modificationNote || modificationNote.trim().length === 0) {
        return { valid: false, message: '预审退回后再次提交需要说明修改点' };
      }
    }
    return { valid: true };
  }

  static async validateSubmit(reimbursementId, modificationNote) {
    const reimbursement = await Reimbursement.findById(reimbursementId);
    if (!reimbursement) {
      return { valid: false, message: '报销单不存在' };
    }

    const projectCheck = await this.checkProjectClosed(reimbursement.project_id);
    if (!projectCheck.valid) return projectCheck;

    const invoiceCheck = await this.checkInvoicesExist(reimbursementId);
    if (!invoiceCheck.valid) return invoiceCheck;

    const noteCheck = await this.checkModificationNote(reimbursementId, modificationNote);
    if (!noteCheck.valid) return noteCheck;

    const budgetCheck = await this.checkBudgetExceed(reimbursementId);
    if (!budgetCheck.valid) {
      return {
        valid: false,
        message: budgetCheck.message,
        needConfirmation: true,
        overBudgetItems: budgetCheck.overBudgetItems
      };
    }

    return { valid: true };
  }
}

module.exports = BusinessRules;
