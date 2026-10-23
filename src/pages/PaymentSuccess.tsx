import { Link } from 'react-router-dom';
import { THEME, Button, Card, PageContainer } from '../components/UI';

export default function PaymentSuccess() {
  return (
    <PageContainer title="Payment Successful!" subtitle="Your account is being set up">
      <Card style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: THEME.success, marginBottom: '1rem' }}>Thank you for your payment!</h2>
        <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>
          Your organization is being provisioned. You will receive an email shortly with your login credentials.
          If you do not see the email within 5 minutes, check your spam folder.
        </p>
        <p style={{ color: THEME.textMuted, marginBottom: '2rem', fontSize: '0.875rem' }}>
          Already have your login credentials? Click below to sign in.
        </p>
        <Link to="/admin/login">
          <Button variant="primary" style={{ width: '100%' }}>Go to Login</Button>
        </Link>
      </Card>
    </PageContainer>
  );
}