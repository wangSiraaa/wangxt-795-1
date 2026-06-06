import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  AuditOutlined,
  HomeOutlined 
} from '@ant-design/icons';
import ProjectDashboard from './pages/ProjectDashboard';
import ReimbursementList from './pages/ReimbursementList';
import ReimbursementDetail from './pages/ReimbursementDetail';
import PreReviewList from './pages/PreReviewList';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页看板</Link> },
  { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/">课题管理</Link> },
  { key: '/reimbursements', icon: <FileTextOutlined />, label: <Link to="/reimbursements">报销申请</Link> },
  { key: '/pre-reviews', icon: <AuditOutlined />, label: <Link to="/pre-reviews">财务预审</Link> }
];

function App() {
  const location = useLocation();

  return (
    <Layout className="app-container">
      <Header style={{ 
        background: '#001529', 
        display: 'flex', 
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0, flex: 1 }}>
          高校科研经费报销预审系统
        </Title>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '16px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 'calc(100vh - 112px)' }}>
            <Routes>
              <Route path="/" element={<ProjectDashboard />} />
              <Route path="/projects" element={<ProjectDashboard />} />
              <Route path="/reimbursements" element={<ReimbursementList />} />
              <Route path="/reimbursements/:id" element={<ReimbursementDetail />} />
              <Route path="/pre-reviews" element={<PreReviewList />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
