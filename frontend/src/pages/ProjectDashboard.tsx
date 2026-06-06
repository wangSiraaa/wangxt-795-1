import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Progress
} from 'antd';
import { 
  ProjectOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../services/api';
import type { Project, BudgetSubject } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'green', text: '进行中' },
  closed: { color: 'default', text: '已结题' }
};

function ProjectDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgets, setBudgets] = useState<BudgetSubject[]>([]);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.getAll();
      if (res.data.success) {
        setProjects(res.data.data || []);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const data = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD')
      };
      const res = await projectApi.create(data);
      if (res.data.success) {
        message.success('创建成功');
        setModalVisible(false);
        form.resetFields();
        loadProjects();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '创建失败');
    }
  };

  const handleCloseProject = async (id: string) => {
    try {
      const res = await projectApi.close(id);
      if (res.data.success) {
        message.success('课题已结题');
        loadProjects();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleViewBudgets = async (project: Project) => {
    setSelectedProject(project);
    try {
      const res = await projectApi.getBudgets(project.id);
      if (res.data.success) {
        setBudgets(res.data.data || []);
        setBudgetModalVisible(true);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '加载失败');
    }
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    closed: projects.filter(p => p.status === 'closed').length,
    totalAmount: projects.reduce((sum, p) => sum + (p.total_amount || 0), 0)
  };

  const columns = [
    {
      title: '课题编号',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: '课题名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <a onClick={() => handleViewBudgets(record)}>{text}</a>
      )
    },
    {
      title: '负责人',
      dataIndex: 'principal',
      key: 'principal',
      width: 100
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '总预算',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (val: number) => `¥${val?.toLocaleString() || 0}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Project) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate(`/reimbursements?projectId=${record.id}`)}
            disabled={record.status === 'closed'}
          >
            {record.status === 'closed' ? '查看报销' : '新建报销'}
          </Button>
          {record.status === 'active' && (
            <Popconfirm
              title="确定要结题吗？结题后将不能新增报销。"
              onConfirm={() => handleCloseProject(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>结题</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>课题看板</h2>
        <p>管理所有科研课题，查看预算使用情况</p>
      </div>

      <div className="page-content">
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="课题总数"
                value={stats.total}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="进行中"
                value={stats.active}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="已结题"
                value={stats.closed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="总预算金额"
                value={stats.totalAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="课题列表"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新建课题
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={projects}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      <Modal
        title="新建课题"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="code" label="课题编号" rules={[{ required: true, message: '请输入课题编号' }]}>
            <Input placeholder="例如：KJ2024001" />
          </Form.Item>
          <Form.Item name="name" label="课题名称" rules={[{ required: true, message: '请输入课题名称' }]}>
            <Input placeholder="请输入课题名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="principal" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="所属部门" rules={[{ required: true, message: '请输入所属部门' }]}>
                <Input placeholder="请输入所属部门" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="total_amount" label="总预算金额" rules={[{ required: true, message: '请输入总预算' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              prefix="¥"
              placeholder="请输入总预算金额"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedProject?.name} - 预算科目详情`}
        open={budgetModalVisible}
        onCancel={() => setBudgetModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setBudgetModalVisible(false)}>关闭</Button>
        ]}
      >
        {selectedProject?.status === 'closed' && (
          <div style={{ 
            background: '#fffbe6', 
            border: '1px solid #ffe58f', 
            padding: '12px', 
            borderRadius: '4px',
            marginBottom: 16 
          }}>
            <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
            该课题已结题，当前为只读状态
          </div>
        )}
        <Table
          rowKey="id"
          dataSource={budgets}
          pagination={false}
          columns={[
            { title: '科目编码', dataIndex: 'code', key: 'code', width: 100 },
            { title: '科目名称', dataIndex: 'name', key: 'name' },
            { 
              title: '预算金额', 
              dataIndex: 'budget_amount', 
              key: 'budget_amount', 
              width: 120,
              render: (v: number) => `¥${v?.toLocaleString() || 0}`
            },
            { 
              title: '已使用', 
              dataIndex: 'used_amount', 
              key: 'used_amount', 
              width: 120,
              render: (v: number) => `¥${v?.toLocaleString() || 0}`
            },
            {
              title: '使用进度',
              key: 'progress',
              render: (_: any, record: BudgetSubject) => {
                const percent = record.budget_amount > 0 
                  ? Math.min((record.used_amount / record.budget_amount) * 100, 100) 
                  : 0;
                return (
                  <Progress 
                    percent={Math.round(percent)} 
                    size="small"
                    status={percent > 100 ? 'exception' : percent > 80 ? 'active' : undefined}
                  />
                );
              }
            }
          ]}
        />
      </Modal>
    </div>
  );
}

export default ProjectDashboard;
