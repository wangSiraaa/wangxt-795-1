const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const Project = require('../models/Project');
const BudgetSubject = require('../models/BudgetSubject');
const Reimbursement = require('../models/Reimbursement');
const { ReimbursementItem, Invoice } = require('../models/OtherModels');

async function initDemoData() {
  console.log('开始初始化演示数据...');

  try {
    const project1Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO projects (id, code, name, principal, department, total_amount, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, 'active', '2024-01-01', '2026-12-31')`,
        [project1Id, 'KJ2024001', '人工智能在教育中的应用研究', '张教授', '计算机学院', 500000],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const budget1 = [
      { id: uuidv4(), project_id: project1Id, code: '01', name: '设备购置费', budget_amount: 200000 },
      { id: uuidv4(), project_id: project1Id, code: '02', name: '材料费', budget_amount: 100000 },
      { id: uuidv4(), project_id: project1Id, code: '03', name: '差旅费', budget_amount: 50000 },
      { id: uuidv4(), project_id: project1Id, code: '04', name: '会议费', budget_amount: 50000 },
      { id: uuidv4(), project_id: project1Id, code: '05', name: '劳务费', budget_amount: 100000 }
    ];

    for (const b of budget1) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO budget_subjects (id, project_id, code, name, budget_amount)
           VALUES (?, ?, ?, ?, ?)`,
          [b.id, b.project_id, b.code, b.name, b.budget_amount],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    const project2Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO projects (id, code, name, principal, department, total_amount, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, 'active', '2023-06-01', '2025-05-31')`,
        [project2Id, 'KJ2023056', '大数据分析平台建设', '李教授', '数学与统计学院', 800000],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const budget2 = [
      { id: uuidv4(), project_id: project2Id, code: '01', name: '设备购置费', budget_amount: 400000 },
      { id: uuidv4(), project_id: project2Id, code: '02', name: '软件购置费', budget_amount: 200000 },
      { id: uuidv4(), project_id: project2Id, code: '03', name: '差旅费', budget_amount: 80000 },
      { id: uuidv4(), project_id: project2Id, code: '04', name: '劳务费', budget_amount: 120000 }
    ];

    for (const b of budget2) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO budget_subjects (id, project_id, code, name, budget_amount)
           VALUES (?, ?, ?, ?, ?)`,
          [b.id, b.project_id, b.code, b.name, b.budget_amount],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    const project3Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO projects (id, code, name, principal, department, total_amount, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, 'closed', '2022-01-01', '2023-12-31')`,
        [project3Id, 'KJ2022012', '区块链技术研究', '王教授', '信息工程学院', 300000],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('演示数据初始化完成！');
    console.log('已创建3个课题（2个进行中，1个已结题）');
    
  } catch (err) {
    console.error('初始化演示数据失败:', err.message);
  } finally {
    db.close();
  }
}

initDemoData();
