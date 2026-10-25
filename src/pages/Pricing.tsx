import { Link } from 'react-router-dom';
import { THEME, Button, Card, PageContainer } from '../components/UI';

const PLANS = [
  { id: 'weekly',  label: 'Weekly',  price: '₦5,000',   days: '7 days',    highlight: false },
  { id: 'monthly', label: 'Monthly', price: '₦15,000',  days: '30 days',   highlight: true  },
  { id: 'yearly',  label: 'Yearly',  price: '₦120,000', days: '365 days',  highlight: false },
];

export default function Pricing() {
  return (
    <PageContainer 
      title="Choose Your Plan" 
      subtitle="Simple pricing. Pay via WhatsApp for immediate setup." 
      action={<Link to="/"><Button variant="outline">Back to Home</Button></Link>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            style={{
              textAlign: 'center',
              borderTop: `4px solid ${plan.highlight ? THEME.primary : THEME.border}`,
              transform: plan.highlight ? 'scale(1.03)' : 'none',
              boxShadow: plan.highlight ? '0 10px 30px rgba(59, 130, 246, 0.2)' : undefined,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {plan.highlight && (
                <div style={{ color: THEME.primary, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  MOST POPULAR
                </div>
              )}
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: THEME.text, marginBottom: '0.5rem' }}>
                {plan.label}
              </h2>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: THEME.primary, marginBottom: '0.25rem' }}>
                {plan.price}
              </div>
              <p style={{ color: THEME.textMuted, marginBottom: '1.5rem' }}>
                per organization / {plan.days}
              </p>
            </div>
            
            {/* WHATSAPP CONTACT BUTTON */}
            <a 
              href={`https://wa.me/2348107247625?text=Hi, I want to subscribe to the ${plan.label} plan for my organization.`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none', display: 'block', width: '100%' }}
            >
              <Button variant={plan.highlight ? 'primary' : 'outline'} style={{ width: '100%' }}>
                Choose {plan.label} (Contact Sales)
              </Button>
            </a>
          </Card>
        ))}
      </div>

      {/* Instructions below the cards */}
      <div style={{ maxWidth: '600px', margin: '3rem auto 0', textAlign: 'center', color: THEME.textMuted, fontSize: '0.9rem' }}>
        <p>
          <strong>How it works:</strong> Click your preferred plan to chat with us on WhatsApp. 
          Once payment is confirmed, your organization account will be created and your login details sent to you within 1 hour.
        </p>
      </div>
    </PageContainer>
  );
}