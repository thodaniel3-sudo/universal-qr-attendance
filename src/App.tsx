import { Routes, Route, Link } from 'react-router-dom';
import PlatformLogin from './pages/PlatformLogin';
import PlatformDashboard from './pages/PlatformDashboard';

import AdminEvents from './pages/AdminEvents';


import NewOrganization from './pages/NewOrganization';
import OrgLogin from './pages/OrgLogin';
import OrgDashboard from './pages/OrgDashboard';
import MemberRegister from './pages/MemberRegister';
import AdminScan from './pages/AdminScan'; // <-- Import it
import ScannerStandalone from './pages/ScannerStandalone';
// ... inside <Routes> ...
<Route path="/admin/scan" element={<AdminScan />} />

function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '42rem', width: '100%', background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Attendance Platform
        </h1>
        <p style={{ color: '#475569', marginBottom: '2rem' }}>
          Universal QR code attendance management
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <Link to="/platform-admin/login" style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', background: '#0f172a', color: 'white', textDecoration: 'none' }}>
            Platform Admin
          </Link>
          <Link to="/admin/login" style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', background: '#2563eb', color: 'white', textDecoration: 'none' }}>
            Organization Admin
          </Link>
          <Link to="/register" style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', background: '#059669', color: 'white', textDecoration: 'none' }}>
            Register as Member
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/scan" element={<AdminScan />} />
      {/* Public Routes */}
      <Route path="/register" element={<MemberRegister />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      {/* Platform Admin Routes */}
      <Route path="/platform-admin/login" element={<PlatformLogin />} />
      <Route path="/platform-admin/dashboard" element={<PlatformDashboard />} />
      <Route path="/platform-admin/organizations/new" element={<NewOrganization />} />
      <Route path="/admin/scanner" element={<ScannerStandalone />} />
      {/* Organization Admin Routes */}
      <Route path="/admin/login" element={<OrgLogin />} />
      <Route path="/admin/dashboard" element={<OrgDashboard />} />
    </Routes>
  );
}