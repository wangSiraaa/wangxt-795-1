const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

require('./models/database');

const projectsRouter = require('./routes/projects');
const reimbursementsRouter = require('./routes/reimbursements');
const invoicesRouter = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '科研经费报销预审系统运行正常' });
});

app.use('/api/projects', projectsRouter);
app.use('/api/reimbursements', reimbursementsRouter);
app.use('/api/invoices', invoicesRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
