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
import AdminMembers from './pages/AdminMembers';
import AdminAttendance from './pages/AdminAttendance';
import PublicScanView from './pages/PublicScanView';
import AdminMemberLink from './pages/AdminMemberLink';
import AdminCSVExport from './pages/AdminCSVExport';
import { THEME, Button, Card } from './components/UI';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import PlatformPayments from './pages/PlatformPayments';



// --- ANIMATION KEYFRAMES ---
const animationStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
  }
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  .delay-400 { animation-delay: 0.4s; }
  
  /* Hover effects */
  .btn-hover {
    transition: all 0.2s ease-in-out !important;
  }
  .btn-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  }
  .btn-outline-hover:hover {
    border-color: ${THEME.textMuted} !important;
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, display: 'flex', flexDirection: 'column' }}>
      
      <style>{animationStyles}</style>

      {/* Clean Navigation Bar */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}` }} className="animate-fade-up">
        
        {/* LEFT: Logo */}
        <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          <span style={{ color: THEME.primary }}>QR</span>Attendance
        </div>
       
        {/* RIGHT: Register Button */}
        <a 
          href="https://universal-qr-attendance-rdxa.vercel.app/register?org=shades"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <Button variant="success" style={{ padding: '0.6rem 1.2rem', fontSize: '1rem' }}>
            👤 Register Now for TESTING
          </Button>
        </a>

      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
        
        <div className="animate-fade-up delay-100" style={{ display: 'inline-block', padding: '0.25rem 1rem', background: 'rgba(59, 130, 246, 0.1)', color: THEME.primary, borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem', border: `1px solid rgba(59, 130, 246, 0.2)` }}>
          Secure • Fast • Reliable
        </div>
        
        <h1 className="animate-fade-up delay-200" style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, maxWidth: '800px', marginBottom: '1.5rem' }}>
          Universal QR Code <br />
          <span style={{ color: THEME.primary }}>Attendance Management System</span>
        </h1> <Link to="/pricing">
  <Button variant="primary">💳 Choose a Plan</Button>
</Link>
        <p className="animate-fade-up delay-300" style={{ fontSize: '1.25rem', color: THEME.textMuted, maxWidth: '600px', marginBottom: '3rem' }}>
          The smartest way to track attendance for churches, schools, and businesses. 
          Generate secure QR codes, verify members with photos, and export reports instantly.
        </p>
     
        {/* THE 3 CLEAN BUTTONS */}
        <div className="animate-fade-up delay-400" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          <Link to="/admin/scanner">
            <Button variant="primary" className="btn-hover" style={{ padding: '1rem 2rem', fontSize: '1.1rem', width: '220px' }}>
              📷 Open Scanner  [LIVE]
            </Button>
          </Link>
          
          <Link to="/admin/login">
            <Button variant="outline" className="btn-hover btn-outline-hover" style={{ padding: '1rem 2rem', fontSize: '1.1rem', width: '220px', border: `1px solid ${THEME.border}` }}>
              🏢 Organization Admin Login
            </Button>
          </Link>
          
          <Link to="/register">
            <Button variant="success" className="btn-hover" style={{ padding: '1rem 2rem', fontSize: '1.1rem', width: '220px' }}>
              👤 Register as Member
            </Button>
          </Link>

        </div>
      </main>
            {/* HOW IT WORKS SECTION */}
      <section className="animate-fade-up delay-500" style={{ padding: '4rem 2rem', background: '#0a0f1c', borderTop: `1px solid ${THEME.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: THEME.text, marginBottom: '1rem' }}>
              How it works
            </h2>
            <p style={{ color: THEME.textMuted, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Get your organization running in four simple steps.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <HowItWorksCard
              number="1"
              icon="💳"
              title="Choose a plan"
              description="Select Weekly, Monthly, or Yearly. Pay securely with your card via Paystack."
            />
            <HowItWorksCard
              number="2"
              icon="🔐"
              title="Set your password"
              description="Immediately after payment, create your admin password and access your dashboard."
            />
            <HowItWorksCard
              number="3"
              icon="📅"
              title="Create events & share"
              description="Create your first event (e.g., Sunday Service) and share your unique member link."
            />
            <HowItWorksCard
              number="4"
              icon="📷"
              title="Scan & track"
              description="Scan your members' QR codes at the event. Track attendance and export reports anytime."
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <a href="/pricing">
              <button style={{ padding: '1rem 2.5rem', background: THEME.primary, color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}>
                Get Started →
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="animate-fade-up delay-500" style={{ padding: '4rem 2rem', borderTop: `1px solid ${THEME.border}`, background: '#0a0f1c' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📸</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Photo Verification</h3>
            <p style={{ color: THEME.textMuted, fontSize: '0.9rem' }}>Scanners pop up the member's photo instantly to prevent proxy attendance.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instant Scanning</h3>
            <p style={{ color: THEME.textMuted, fontSize: '0.9rem' }}>High-speed browser-based camera scanning. No extra hardware required.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Live Reports</h3>
            <p style={{ color: THEME.textMuted, fontSize: '0.9rem' }}>View attendance history in real-time and download CSV reports for accounting.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', color: THEME.textMuted, borderTop: `1px solid ${THEME.border}`, fontSize: '0.875rem' }}>
        <p>© {new Date().getFullYear()} QR Attendance Platform. All rights reserved.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/platform-admin/login" style={{ color: THEME.textMuted, textDecoration: 'none', margin: '0 1rem', fontSize: '0.75rem' }}>
            Platform Owner Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}




function HowItWorksCard({ number, icon, title, description }: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group hover:-translate-y-1 transition-all duration-300">
      <Card style={{ textAlign: 'center', position: 'relative', height: '100%', background: '#0f172a' }}>
        <div style={{
          position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
          width: '28px', height: '28px', borderRadius: '50%',
          background: THEME.primary, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
        }}>
          {number}
        </div>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', marginTop: '0.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: THEME.textMuted, fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>{description}</p>
      </Card>
    </div>
  );
}





export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<MemberRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/platform-admin/login" element={<PlatformLogin />} />
      <Route path="/platform-admin/dashboard" element={<PlatformDashboard />} />
      <Route path="/platform-admin/organizations/new" element={<NewOrganization />} />
      <Route path="/admin/csv-export" element={<AdminCSVExport />} />
      <Route path="/scan/:token" element={<PublicScanView />} />
      <Route path="/admin/login" element={<OrgLogin />} />
      <Route path="/admin/dashboard" element={<OrgDashboard />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/members" element={<AdminMembers />} />
      <Route path="/admin/attendance" element={<AdminAttendance />} />
      <Route path="/admin/member-link" element={<AdminMemberLink />} />
     <Route path="/pricing" element={<Pricing />} />
     <Route path="/payment-success" element={<PaymentSuccess />} />
     <Route path="/platform-admin/payments" element={<PlatformPayments />} /> 
     
     
     
     
      <Route path="/admin/scan" element={<AdminScan />} />
      <Route path="/admin/scanner" element={<ScannerStandalone />} />
    </Routes>
  );
}