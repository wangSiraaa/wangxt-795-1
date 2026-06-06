const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

console.log('开始加载模块...');
try {
  require('./src/models/database');
  console.log('数据库模块加载成功');
} catch(e) {
  console.error('数据库模块加载失败:', e.message);
  console.error(e.stack);
  process.exit(1);
}

try {
  const projectsRouter = require('./src/routes/projects');
  const reimbursementsRouter = require('./src/routes/reimbursements');
  const invoicesRouter = require('./src/routes/invoices');
  console.log('路由模块加载成功');
} catch(e) {
  console.error('路由模块加载失败:', e.message);
  console.error(e.stack);
  process.exit(1);
}

console.log('所有模块加载成功，可以启动服务');
