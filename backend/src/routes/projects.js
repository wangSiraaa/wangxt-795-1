const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const BudgetSubject = require('../models/BudgetSubject');

router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '课题不存在' });
    }
    const budgets = await BudgetSubject.findByProjectId(req.params.id);
    res.json({ success: true, data: { ...project, budgets } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/close', async (req, res) => {
  try {
    const result = await Project.updateStatus(req.params.id, 'closed');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/budgets', async (req, res) => {
  try {
    const budgets = req.body.budgets || [];
    const results = [];
    for (const budget of budgets) {
      const result = await BudgetSubject.create({
        project_id: req.params.id,
        ...budget
      });
      results.push(result);
    }
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/budgets', async (req, res) => {
  try {
    const budgets = await BudgetSubject.findByProjectId(req.params.id);
    res.json({ success: true, data: budgets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
