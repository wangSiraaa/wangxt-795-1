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
  Radio,
  message,
  Descriptions,
  Row,
  Col,
  Statistic
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { reimbursementApi } from '../services/api';
import type { Reimbursement } from '../types';

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pre_reviewing: { color: 'processing', text: '预审中' },
  pre_reviewed: { color: 'success', text: '预审通过' },
  rejected: { color: 'error', text: '已退回' },
  confirmed: { color: 'purple', text: '已确认' }
};

function PreReviewList() {
  const navigate = useNavigate();
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null);
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

  useEffect(() => {
    loadReimbursements();
  }, []);

  const handleReview = (record: Reimbursement) => {
    setSelectedReimbursement(record);
    setModalVisible(true);
    form.resetFields();
  };

  const handleSubmitReview = async (values: any) => {
    if (!selectedReimbursement) return;
    try {
      const res = await reimbursementApi.preReview(selectedReimbursement.id, {
        reviewer: '财务人员',
        result: values.result,
        opinion: values.opinion
      });
      if (res.data.success) {
        message.success(values.result === 'pass' ? '预审通过' : '已退回');
        setModalVisible(false);
        loadReimbursements();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const pendingCount = reimbursements.filter(r => r.status === 'pre_reviewing').length;
  const passedCount = reimbursements.filter(r => r.status === 'pre_reviewed').length;
  const rejectedCount = reimbursements.filter(r => r.status === 'rejected').length;

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
      title: '提交时间',
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 180,
      render: (val: string) => val || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Reimbursement) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reimbursements/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'pre_reviewing' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleReview(record)}
            >
              预审
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>财务预审</h2>
        <p>审核报销单的票据完整性和预算合规性</p>
      </div>

      <div className="page-content">
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="待预审"
                value={pendingCount}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="已通过"
                value={passedCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="已退回"
                value={rejectedCount}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card-stat">
              <Statistic
                title="总单数"
                value={reimbursements.length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="预审列表">
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
        title="财务预审"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedReimbursement && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="报销单编号">{selectedReimbursement.code}</Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedReimbursement.applicant}</Descriptions.Item>
              <Descriptions.Item label="所属课题">{selectedReimbursement.project_name}</Descriptions.Item>
              <Descriptions.Item label="金额">
                <strong>¥{selectedReimbursement.total_amount?.toLocaleString() || 0}</strong>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
              <Form.Item
                name="result"
                label="预审结果"
                rules={[{ required: true, message: '请选择预审结果' }]}
              >
                <Radio.Group>
                  <Radio.Button value="pass">
                    <CheckOutlined style={{ color: '#52c41a' }} /> 通过
                  </Radio.Button>
                  <Radio.Button value="reject">
                    <CloseOutlined style={{ color: '#ff4d4f' }} /> 退回
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="opinion"
                label="预审意见"
                rules={[{ required: true, message: '请输入预审意见' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入预审意见..." />
              </Form.Item>
              <Form.Item>
                <Space style={{ float: 'right' }}>
                  <Button onClick={() => setModalVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">提交</Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}

export default PreReviewList;
