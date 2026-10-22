import { Routes, Route, Link } from 'react-router-dom';
import PlatformLogin from './pages/PlatformLogin';
import PlatformDashboard from './pages/PlatformDashboard';
import NewOrganization from './pages/NewOrganization';
import OrgLogin from './pages/OrgLogin';
import OrgDashboard from './pages/OrgDashboard';
import MemberRegister from './pages/MemberRegister';
import AdminScan from './pages/AdminScan'; 
import ScannerStandalone from './pages/ScannerStandalone';
import AdminEvents from './pages/AdminEvents';
import { THEME, Card } from './components/UI';
import AdminMembers from './pages/AdminMembers';
function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card style={{ maxWidth: '42rem', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: THEME.text, marginBottom: '1rem' }}>
          Attendance Platform
        </h1>
        <p style={{ color: THEME.textMuted, fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Universal QR code attendance management for churches, schools, and businesses.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/platform-admin/login" style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', background: THEME.primary, color: 'white', textDecoration: 'none', fontWeight: 600 }}>
            Platform Admin
          </Link>
          <Link to="/admin/login" style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', background: '#0f172a', color: 'white', textDecoration: 'none', fontWeight: 600, border: `1px solid ${THEME.border}` }}>
            Organization Admin
          </Link>
          <Link to="/register" style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', background: THEME.success, color: 'white', textDecoration: 'none', fontWeight: 600 }}>
            Register as Member
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<MemberRegister />} />
      <Route path="/admin/members" element={<AdminMembers />} />
      {/* Platform Admin Routes */}
      <Route path="/platform-admin/login" element={<PlatformLogin />} />
      <Route path="/platform-admin/dashboard" element={<PlatformDashboard />} />
      <Route path="/platform-admin/organizations/new" element={<NewOrganization />} />
      
      {/* Organization Admin Routes */}
      <Route path="/admin/login" element={<OrgLogin />} />
      <Route path="/admin/dashboard" element={<OrgDashboard />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      
      {/* The Scanner */}
      <Route path="/admin/scan" element={<AdminScan />} />
      <Route path="/admin/scanner" element={<ScannerStandalone />} />
    </Routes>
  );
}