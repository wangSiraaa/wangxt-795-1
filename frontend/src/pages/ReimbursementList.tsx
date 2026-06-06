import { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  InputNumber
} from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reimbursementApi, projectApi } from '../services/api';
import type { Reimbursement, Project } from '../types';

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pre_reviewing: { color: 'processing', text: '预审中' },
  pre_reviewed: { color: 'success', text: '预审通过' },
  rejected: { color: 'error', text: '已退回' },
  confirmed: { color: 'purple', text: '已确认' }
};

function ReimbursementList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const loadReimbursements = async () => {
    setLoading(true);
    try {
      const res = await reimbursementApi.getAll();
      if (res.data.success) {
        setReimbursements(res.data.data || []);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await projectApi.getAll();
      if (res.data.success) {
        setProjects(res.data.data?.filter(p => p.status === 'active') || []);
        const projectId = searchParams.get('projectId');
        if (projectId) {
          form.setFieldsValue({ project_id: projectId });
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '加载失败');
    }
  };

  useEffect(() => {
    loadReimbursements();
    loadProjects();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const res = await reimbursementApi.create(values);
      if (res.data.success) {
        message.success('创建成功');
        setModalVisible(false);
        form.resetFields();
        loadReimbursements();
        navigate(`/reimbursements/${res.data.data!.id}`);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '创建失败');
    }
  };

  const columns = [
    {
      title: '报销单编号',
      dataIndex: 'code',
      key: 'code',
      width: 130
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '所属课题',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100
    },
    {
      title: '金额',
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Reimbursement) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reimbursements/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>报销申请</h2>
        <p>管理所有报销单据，提交财务预审</p>
      </div>

      <div className="page-content">
        <Card
          title="报销单列表"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新建报销
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={reimbursements}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      <Modal
        title="新建报销单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item 
            name="project_id" 
            label="所属课题" 
            rules={[{ required: true, message: '请选择所属课题' }]}
          >
            <Select placeholder="请选择课题">
              {projects.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.code} - {p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="报销标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入报销标题" />
          </Form.Item>
          <Form.Item name="applicant" label="申请人" rules={[{ required: true, message: '请输入申请人' }]}>
            <Input placeholder="请输入申请人姓名" />
          </Form.Item>
          <Form.Item name="description" label="报销说明">
            <Input.TextArea rows={3} placeholder="请输入报销说明" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ReimbursementList;
