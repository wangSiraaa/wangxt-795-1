const http = require('http');
const { randomUUID } = require('crypto');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api';

function parseUrl(urlStr) {
  const url = new URL(urlStr);
  return {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search
  };
}

function request(method, pathname, data = null, headers = {}) {
  return new Promise((resolve) => {
    const url = parseUrl(BASE_URL + API_PREFIX + pathname);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { message: body } });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, data: { message: err.message } });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function uploadFile(reimbursementId, invoiceNo, amount) {
  return new Promise((resolve) => {
    const url = parseUrl(BASE_URL + API_PREFIX + '/invoices/' + reimbursementId);
    const boundary = '----TestBoundary' + Date.now();
    const CRLF = '\r\n';

    const fileBuffer = Buffer.from('%PDF-1.4\nTest PDF content\n%%EOF');
    const filename = 'test-' + randomUUID() + '.pdf';

    let body = Buffer.alloc(0);

    const fields = [
      { name: 'invoice_no', value: invoiceNo },
      { name: 'amount', value: String(amount) }
    ];

    for (const field of fields) {
      body = Buffer.concat([
        body,
        Buffer.from('--' + boundary + CRLF),
        Buffer.from('Content-Disposition: form-data; name="' + field.name + '"' + CRLF + CRLF),
        Buffer.from(field.value + CRLF)
      ]);
    }

    body = Buffer.concat([
      body,
      Buffer.from('--' + boundary + CRLF),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="' + filename + '"' + CRLF),
      Buffer.from('Content-Type: application/pdf' + CRLF + CRLF),
      fileBuffer,
      Buffer.from(CRLF),
      Buffer.from('--' + boundary + '--' + CRLF)
    ]);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.path,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length
      }
    };

    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (chunk) => { resBody += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { message: resBody } });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, data: { message: err.message } });
    });

    req.write(body);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function step(title) {
  console.log('\n' + '='.repeat(60));
  console.log('  ' + title);
  console.log('='.repeat(60));
}

function assert(name, condition, message = '') {
  if (condition) {
    passed++;
    console.log('\x1b[32m✓ PASS\x1b[0m: ' + name);
    if (message) console.log('       ' + message);
  } else {
    failed++;
    console.log('\x1b[31m✗ FAIL\x1b[0m: ' + name);
    if (message) console.log('       ' + message);
  }
  return condition;
}

async function waitForHealth(maxRetries = 30, delay = 2000) {
  console.log('等待后端服务就绪...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await request('GET', '/health');
      if (res.status === 200 && res.data.success) {
        console.log('✓ 后端服务已就绪');
        return true;
      }
    } catch (e) {}
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, delay));
  }
  console.log('\n✗ 后端服务启动超时');
  return false;
}

async function main() {
  console.log('\x1b[36m');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     高校科研经费报销预审系统 - 验收测试                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');
  console.log('服务地址: ' + BASE_URL);
  console.log('开始时间: ' + new Date().toLocaleString('zh-CN'));

  const invoiceNo = 'INV-TEST-' + Date.now();
  let projectId = null;
  let budgetId = null;
  let reimbursementId = null;

  const healthOk = await waitForHealth();
  if (!healthOk) {
    process.exit(1);
  }

  step('【步骤1】健康检查');
  const health = await request('GET', '/health');
  assert('服务健康检查', health.status === 200 && health.data.success, health.data.message);

  step('【步骤2】创建测试课题');
  const projectRes = await request('POST', '/projects', {
    code: 'PRJ-' + Date.now(),
    name: '验收测试课题-' + Date.now(),
    principal: '测试负责人',
    department: '计算机学院',
    total_amount: 100000
  });
  if (assert('创建课题成功', projectRes.status === 200 && projectRes.data.success)) {
    projectId = projectRes.data.data.id;
    console.log('       课题ID: ' + projectId);
  }
  if (!projectId) {
    console.log('\n无法继续测试，课题创建失败');
    process.exit(1);
  }

  step('【步骤3】创建预算科目');
  const budgetRes = await request('POST', '/projects/' + projectId + '/budgets', {
    budgets: [
      { code: '01', name: '差旅费', budget_amount: 30000 },
      { code: '02', name: '设备费', budget_amount: 50000 }
    ]
  });
  if (assert('创建预算科目成功', budgetRes.status === 200 && budgetRes.data.success)) {
    const budgets = await request('GET', '/projects/' + projectId + '/budgets');
    if (budgets.data.data && budgets.data.data.length > 0) {
      budgetId = budgets.data.data[0].id;
      console.log('       预算ID: ' + budgetId);
      console.log('       科目: 差旅费(30000), 设备费(50000)');
    }
  }

  step('【步骤4】创建报销单');
  const reimbRes = await request('POST', '/reimbursements', {
    project_id: projectId,
    title: '测试报销单-' + Date.now(),
    applicant: '测试申请人',
    department: '计算机学院'
  });
  if (assert('创建报销单成功', reimbRes.status === 200 && reimbRes.data.success)) {
    reimbursementId = reimbRes.data.data.id;
    console.log('       报销单ID: ' + reimbursementId);
    console.log('       当前状态: ' + reimbRes.data.data.status);
  }
  if (!reimbursementId || !budgetId) {
    console.log('\n无法继续测试，报销单或预算科目创建失败');
    process.exit(1);
  }

  step('【步骤5】添加报销明细');
  const updateRes = await request('PUT', '/reimbursements/' + reimbursementId, {
    title: '测试报销单-差旅费',
    items: [
      {
        budget_subject_id: budgetId,
        subject_name: '差旅费',
        amount: 5000,
        description: '北京出差交通费'
      }
    ]
  });
  assert('添加报销明细成功', updateRes.status === 200 && updateRes.data.success);

  step('【步骤6】验证：缺少票据不能送审');
  const submitNoInvoice = await request('POST', '/reimbursements/' + reimbursementId + '/submit', {
    operator: '测试申请人'
  });
  const noInvMsg = submitNoInvoice.data.message || '';
  assert('缺少票据时提交送审被拒绝',
    submitNoInvoice.status === 400 && noInvMsg.includes('票据'),
    '返回状态: ' + submitNoInvoice.status + ', 消息: ' + noInvMsg);

  step('【步骤7】上传第一张票据');
  const upload1 = await uploadFile(reimbursementId, invoiceNo, 5000);
  assert('上传第一张票据成功',
    upload1.status === 200 && upload1.data.success,
    '发票号: ' + invoiceNo + ', 金额: 5000');

  step('【步骤8】验证：使用重复发票号被拒绝');
  const upload2 = await uploadFile(reimbursementId, invoiceNo, 3000);
  const dupMsg = upload2.data.message || '';
  assert('重复发票号上传被拒绝',
    upload2.status === 400 && (dupMsg.includes('已存在') || dupMsg.includes('重复')),
    '返回状态: ' + upload2.status + ', 消息: ' + dupMsg);

  step('【步骤9】有票据后成功提交送审');
  const submitOk = await request('POST', '/reimbursements/' + reimbursementId + '/submit', {
    operator: '测试申请人'
  });
  const submitStatus = submitOk.data.data ? submitOk.data.data.status : '';
  assert('有票据后成功提交送审',
    submitOk.status === 200 && submitOk.data.success && submitStatus === 'pre_reviewing',
    '状态变更: draft → ' + submitStatus);

  step('【步骤10】验证：课题结题后不能新增报销');
  await request('POST', '/projects/' + projectId + '/close');
  const closedReimb = await request('POST', '/reimbursements', {
    project_id: projectId,
    title: '结题后尝试新增',
    applicant: '测试'
  });
  const closedMsg = closedReimb.data.message || '';
  assert('课题结题后不能新增报销',
    closedReimb.status === 400 && closedMsg.includes('已结题'),
    '返回状态: ' + closedReimb.status + ', 消息: ' + closedMsg);

  step('测试结果汇总');
  console.log('');
  console.log('  通过: \x1b[32m' + passed + '\x1b[0m 项');
  console.log('  失败: \x1b[31m' + failed + '\x1b[0m 项');
  console.log('  总计: ' + (passed + failed) + ' 项');
  console.log('');

  console.log('已验证的业务规则：');
  console.log('  ✓ 规则2: 票据缺失不能送审');
  console.log('  ✓ 规则3: 项目结题后只能查看不能新增');
  console.log('  ✓ 规则4: 同一张发票号不能重复报销');
  console.log('');

  if (failed === 0) {
    console.log('\x1b[32m');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✓ 所有测试通过！系统验收合格                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31m');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✗ 存在测试未通过，请检查                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\x1b[0m');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('测试执行异常:', err);
  process.exit(1);
});
