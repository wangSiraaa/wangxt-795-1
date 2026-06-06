import { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Form, 
  Input, 
  Select,
  InputNumber,
  Modal,
  Upload,
  message,
  Tabs,
  Timeline,
  Alert,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  UploadOutlined,
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  WarningOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { reimbursementApi, projectApi, invoiceApi } from '../services/api';
import type { Reimbursement, BudgetSubject, ReimbursementItem, OverBudgetItem } from '../types';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pre_reviewing: { color: 'processing', text: '预审中' },
  pre_reviewed: { color: 'success', text: '预审通过' },
  rejected: { color: 'error', text: '已退回' },
  confirmed: { color: 'purple', text: '已确认' }
};

function ReimbursementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null);
  const [budgets, setBudgets] = useState<BudgetSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [overBudgetItems, setOverBudgetItems] = useState<OverBudgetItem[]>([]);
  const [itemForm] = Form.useForm();
  const [submitForm] = Form.useForm();
  const [isReadOnly, setIsReadOnly] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await reimbursementApi.getById(id);
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setReimbursement(data);
        setIsReadOnly(data.project_status === 'closed');
        
        const projRes = await projectApi.getBudgets(data.project_id);
        if (projRes.data.success) {
          setBudgets(projRes.data.data || []);
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleAddItem = async (values: any) => {
    if (!reimbursement) return;
    try {
      const items = reimbursement.items || [];
      const newItem = {
        budget_subject_id: values.budget_subject_id,
        subject_name: budgets.find(b => b.id === values.budget_subject_id)?.name || '',
        amount: values.amount,
        description: values.description
      };
      const newItems = [...items, newItem];
      
      const res = await reimbursementApi.update(id!, { items: newItems });
      if (res.data.success) {
        message.success('添加成功');
        setItemModalVisible(false);
        itemForm.resetFields();
        loadDetail();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!reimbursement) return;
    try {
      const items = [...(reimbursement.items || [])];
      items.splice(index, 1);
      const res = await reimbursementApi.update(id!, { items });
      if (res.data.success) {
        message.success('删除成功');
        loadDetail();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: true,
    beforeUpload: (file, fileList) => {
      return true;
    },
    customRequest: async ({ file, data, filename, onSuccess, onError }) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('invoice_no', (data as any).invoice_no);
        formData.append('invoice_code', (data as any).invoice_code || '');
        formData.append('amount', (data as any).amount);
        formData.append('invoice_date', (data as any).invoice_date || '');
        formData.append('vendor', (data as any).vendor || '');

        const res: any = await invoiceApi.upload(id!, formData);
        if (res.data.success) {
          message.success('票据上传成功');
          onSuccess?.(res.data, file);
          loadDetail();
        } else {
          message.error(res.data.message || '上传失败');
          onError?.(new Error(res.data.message));
        }
      } catch (err: any) {
        message.error(err.response?.data?.message || '上传失败');
        onError?.(err);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const res = await reimbursementApi.submit(id!, {
        modification_note: values.modification_note,
        operator: '当前用户'
      });
      if (res.data.success) {
        message.success('提交成功');
        setSubmitModalVisible(false);
        submitForm.resetFields();
        loadDetail();
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.needConfirmation) {
        setOverBudgetItems(data.overBudgetItems || []);
        setConfirmModalVisible(true);
      } else {
        message.error(data?.message || '提交失败');
      }
    }
  };

  const handleConfirm = async (item: OverBudgetItem, result: 'approved' | 'rejected') => {
    try {
      const res = await reimbursementApi.confirm(id!, {
        confirmer: '项目负责人',
        subject_id: item.subject_id,
        over_amount: item.over_amount,
        result,
        opinion: result === 'approved' ? '同意超预算' : '不同意超预算',
        operator: '项目负责人'
      });
      if (res.data.success) {
        message.success(result === 'approved' ? '已确认通过' : '已拒绝');
        setConfirmModalVisible(false);
        loadDetail();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const res = await invoiceApi.delete(invoiceId);
      if (res.data.success) {
        message.success('删除成功');
        loadDetail();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  if (!reimbursement) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  const isProjectClosed = reimbursement.project_status === 'closed';
  const canEdit = reimbursement.status === 'draft' || reimbursement.status === 'rejected';
  const effectiveCanEdit = canEdit && !isProjectClosed;
  const totalInvoiceAmount = (reimbursement.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);

  const itemColumns = [
    { title: '预算科目', dataIndex: 'subject_name', key: 'subject_name' },
    { 
      title: '金额', 
      dataIndex: 'amount', 
      key: 'amount', 
      width: 150,
      render: (v: number) => `¥${v?.toLocaleString() || 0}`
    },
    { title: '说明', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, __: any, index: number) => (
        effectiveCanEdit ? (
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDeleteItem(index)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        ) : null
      )
    }
  ];

  const invoiceColumns = [
    { title: '发票号', dataIndex: 'invoice_no', key: 'invoice_no', width: 150 },
    { 
      title: '金额', 
      dataIndex: 'amount', 
      key: 'amount', 
      width: 120,
      render: (v: number) => `¥${v?.toLocaleString() || 0}`
    },
    { title: '开票日期', dataIndex: 'invoice_date', key: 'invoice_date', width: 120 },
    { title: '销售方', dataIndex: 'vendor', key: 'vendor' },
    { title: '文件名', dataIndex: 'file_name', key: 'file_name' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        effectiveCanEdit ? (
          <Space>
            {record.file_path && (
              <a 
                href={invoiceApi.downloadUrl(record.file_path)} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                下载
              </a>
            )}
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDeleteInvoice(record.id)}>
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        ) : (
          record.file_path && (
            <a 
              href={invoiceApi.downloadUrl(record.file_path)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              下载
            </a>
          )
        )
      )
    }
  ];

  const budgetUsageData = budgets.map(b => {
    const items = reimbursement.items || [];
    const usedInThis = items.filter(i => i.budget_subject_id === b.id)
      .reduce((sum, i) => sum + i.amount, 0);
    const totalUsed = b.used_amount + (reimbursement.status === 'pre_reviewed' ? usedInThis : 0);
    return {
      ...b,
      used_in_this: usedInThis,
      total_used: totalUsed,
      remaining: b.budget_amount - b.used_amount
    };
  });

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reimbursements')}>
            返回列表
          </Button>
          <h2 style={{ margin: 0 }}>报销单详情</h2>
          <Tag color={statusMap[reimbursement.status]?.color}>
            {statusMap[reimbursement.status]?.text}
          </Tag>
          {isProjectClosed && <Tag color="warning">课题已结题-只读</Tag>}
        </Space>
      </div>

      <div className="page-content">
        {isProjectClosed && (
          <Alert
            message="课题已结题"
            description="该课题已结题，当前报销单处于只读状态，不能进行编辑和提交操作。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Card style={{ marginBottom: 16 }}>
          <Descriptions title="基本信息" column={3} bordered>
            <Descriptions.Item label="报销单编号">{reimbursement.code}</Descriptions.Item>
            <Descriptions.Item label="所属课题">{reimbursement.project_name}</Descriptions.Item>
            <Descriptions.Item label="申请人">{reimbursement.applicant}</Descriptions.Item>
            <Descriptions.Item label="标题">{reimbursement.title}</Descriptions.Item>
            <Descriptions.Item label="报销金额">
              <strong style={{ color: '#1890ff' }}>¥{reimbursement.total_amount?.toLocaleString() || 0}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{reimbursement.created_at}</Descriptions.Item>
            {reimbursement.description && (
              <Descriptions.Item label="说明" span={3}>{reimbursement.description}</Descriptions.Item>
            )}
            {reimbursement.modification_note && (
              <Descriptions.Item label="修改说明" span={3} style={{ background: '#fffbe6' }}>
                {reimbursement.modification_note}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Tabs defaultActiveKey="items">
          <TabPane tab="报销明细" key="items">
            <Card
              extra={effectiveCanEdit && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setItemModalVisible(true)}>
                  添加明细
                </Button>
              )}
            >
              <Table
                rowKey="id"
                columns={itemColumns}
                dataSource={reimbursement.items || []}
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={1}>合计</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>¥{reimbursement.total_amount?.toLocaleString() || 0}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </TabPane>

          <TabPane tab="票据附件" key="invoices">
            <Card>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="票据张数"
                      value={(reimbursement.invoices || []).length}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="票据总金额"
                      value={totalInvoiceAmount}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="差额"
                      value={reimbursement.total_amount - totalInvoiceAmount}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ 
                        color: Math.abs(reimbursement.total_amount - totalInvoiceAmount) > 0.01 ? '#ff4d4f' : '#52c41a' 
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {effectiveCanEdit && (
                <div style={{ marginBottom: 16 }}>
                  <Dragger {...uploadProps} data={{}}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽票据文件到此区域上传</p>
                    <p className="ant-upload-hint">
                      支持 PDF、图片等格式，上传时请在弹出框填写发票信息
                    </p>
                  </Dragger>
                </div>
              )}

              <Table
                rowKey="id"
                columns={invoiceColumns}
                dataSource={reimbursement.invoices || []}
                pagination={false}
                locale={{ emptyText: '暂无票据附件' }}
              />

              {(reimbursement.invoices || []).length === 0 && effectiveCanEdit && (
                <Alert
                  message="票据缺失"
                  description="请上传票据附件后再提交送审，否则系统将拒绝提交。"
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="预算占用" key="budget">
            <Card>
              <Table
                rowKey="id"
                dataSource={budgetUsageData}
                pagination={false}
                columns={[
                  { title: '科目编码', dataIndex: 'code', key: 'code', width: 100 },
                  { title: '科目名称', dataIndex: 'name', key: 'name' },
                  {
                    title: '总预算',
                    dataIndex: 'budget_amount',
                    key: 'budget_amount',
                    width: 120,
                    render: (v: number) => `¥${v?.toLocaleString() || 0}`
                  },
                  {
                    title: '已占用',
                    dataIndex: 'used_amount',
                    key: 'used_amount',
                    width: 120,
                    render: (v: number) => `¥${v?.toLocaleString() || 0}`
                  },
                  {
                    title: '本次申请',
                    dataIndex: 'used_in_this',
                    key: 'used_in_this',
                    width: 120,
                    render: (v: number) => v > 0 ? `¥${v.toLocaleString()}` : '-'
                  },
                  {
                    title: '可用余额',
                    key: 'remaining',
                    width: 120,
                    render: (_: any, record: any) => {
                      const rem = record.remaining;
                      return (
                        <span style={{ color: rem < 0 ? '#ff4d4f' : '#52c41a' }}>
                          ¥{rem?.toLocaleString() || 0}
                        </span>
                      );
                    }
                  },
                  {
                    title: '使用进度',
                    key: 'progress',
                    render: (_: any, record: any) => {
                      const percent = record.budget_amount > 0
                        ? Math.min(((record.used_amount + (record.used_in_this || 0)) / record.budget_amount) * 100, 100)
                        : 0;
                      return (
                        <Progress
                          percent={Math.round(percent)}
                          size="small"
                          status={percent > 100 ? 'exception' : undefined}
                        />
                      );
                    }
                  }
                ]}
              />
            </Card>
          </TabPane>

          <TabPane tab="预审与确认记录" key="reviews">
            <Card>
              <Row gutter={16}>
                <Col span={12}>
                  <h4>预审记录</h4>
                  {(reimbursement.preReviews || []).length === 0 ? (
                    <p style={{ color: '#999' }}>暂无预审记录</p>
                  ) : (
                    <Timeline>
                      {(reimbursement.preReviews || []).map(r => (
                        <Timeline.Item key={r.id}>
                          <p><strong>审核人：</strong>{r.reviewer}</p>
                          <p><strong>结果：</strong>
                            <Tag color={r.result === 'pass' ? 'green' : 'red'}>
                              {r.result === 'pass' ? '通过' : '退回'}
                            </Tag>
                          </p>
                          {r.opinion && <p><strong>意见：</strong>{r.opinion}</p>}
                          <p style={{ color: '#999', fontSize: 12 }}>{r.reviewed_at}</p>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  )}
                </Col>
                <Col span={12}>
                  <h4>超预算确认记录</h4>
                  {(reimbursement.confirmations || []).length === 0 ? (
                    <p style={{ color: '#999' }}>暂无确认记录</p>
                  ) : (
                    <Timeline>
                      {(reimbursement.confirmations || []).map(c => (
                        <Timeline.Item key={c.id}>
                          <p><strong>确认人：</strong>{c.confirmer}</p>
                          <p><strong>科目：</strong>{c.subject_name}</p>
                          <p><strong>超预算金额：</strong>¥{c.over_amount?.toLocaleString()}</p>
                          <p><strong>结果：</strong>
                            <Tag color={c.result === 'approved' ? 'green' : 'red'}>
                              {c.result === 'approved' ? '同意' : '拒绝'}
                            </Tag>
                          </p>
                          {c.opinion && <p><strong>意见：</strong>{c.opinion}</p>}
                          <p style={{ color: '#999', fontSize: 12 }}>{c.confirmed_at}</p>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  )}
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="状态历史" key="history">
            <Card>
              <Timeline>
                {(reimbursement.history || []).map(h => (
                  <Timeline.Item key={h.id}>
                    <p>
                      {h.from_status && (
                        <>
                          <Tag color={statusMap[h.from_status]?.color}>{statusMap[h.from_status]?.text}</Tag>
                          <span style={{ margin: '0 8px' }}>→</span>
                        </>
                      )}
                      <Tag color={statusMap[h.to_status]?.color}>{statusMap[h.to_status]?.text}</Tag>
                    </p>
                    <p><strong>操作人：</strong>{h.operator}</p>
                    {h.remark && <p><strong>备注：</strong>{h.remark}</p>}
                    <p style={{ color: '#999', fontSize: 12 }}>{h.created_at}</p>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </TabPane>
        </Tabs>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {effectiveCanEdit && (
              <Button type="primary" size="large" onClick={() => setSubmitModalVisible(true)}>
                提交送审
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Modal
        title="添加报销明细"
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleAddItem}>
          <Form.Item
            name="budget_subject_id"
            label="预算科目"
            rules={[{ required: true, message: '请选择预算科目' }]}
          >
            <Select placeholder="请选择预算科目">
              {budgets.map(b => (
                <Select.Option key={b.id} value={b.id}>
                  {b.code} - {b.name} (剩余: ¥{(b.budget_amount - b.used_amount)?.toLocaleString()})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setItemModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交送审"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={submitForm} layout="vertical" onFinish={handleSubmit}>
          {(reimbursement.history || []).some(h => h.to_status === 'rejected') && (
            <Form.Item
              name="modification_note"
              label="修改说明"
              rules={[{ required: true, message: '预审退回后再次提交需要说明修改点' }]}
            >
              <TextArea rows={4} placeholder="请详细说明对预审意见的修改内容..." />
            </Form.Item>
          )}
          <Alert
            message="提交确认"
            description="提交后将进入财务预审流程，请确认票据和明细完整无误。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setSubmitModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="超预算确认"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setConfirmModalVisible(false)}>关闭</Button>
        ]}
      >
        <Alert
          message="存在超预算科目"
          description="以下科目申请金额超过预算余额，需要项目负责人确认。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        {overBudgetItems.map(item => (
          <Card 
            key={item.subject_id} 
            size="small" 
            style={{ marginBottom: 12 }}
            title={`${item.subject_name}（超支 ¥${item.over_amount?.toLocaleString()}）`}
            extra={
              <Space>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<CheckOutlined />}
                  onClick={() => handleConfirm(item, 'approved')}
                >
                  同意
                </Button>
                <Button 
                  danger 
                  size="small" 
                  icon={<CloseOutlined />}
                  onClick={() => handleConfirm(item, 'rejected')}
                >
                  拒绝
                </Button>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <p style={{ margin: 0 }}>预算总额：¥{item.budget_amount?.toLocaleString()}</p>
              </Col>
              <Col span={8}>
                <p style={{ margin: 0 }}>已使用：¥{item.used_amount?.toLocaleString()}</p>
              </Col>
              <Col span={8}>
                <p style={{ margin: 0 }}>本次申请：¥{item.requested?.toLocaleString()}</p>
              </Col>
            </Row>
            <p style={{ margin: '8px 0 0', color: '#ff4d4f' }}>
              可用余额：¥{item.remaining?.toLocaleString()}
            </p>
          </Card>
        ))}
      </Modal>
    </div>
  );
}

export default ReimbursementDetail;
