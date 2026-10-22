import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';

export default function AdminScan() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // 1. Load User & Events
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      
      const org = user.app_metadata?.org_id;
      setOrgId(org);

      if (org) {
        const { data } = await supabase
          .from('events')
          .select('id, name')
          .eq('organization_id', org)
          .eq('status', 'open')
          .order('starts_at', { ascending: false });
        if (data) {
          setEvents(data);
          if (data.length > 0) setSelectedEvent(data[0].id);
        }
      }
    }
    init();
  }, [navigate]);

  // 2. Start Camera
  const startScanner = () => {
    if (!selectedEvent) return alert("Please select an event first.");
    setScanResult(null);
    setError(null);
    
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (!isScanningRef.current) {
          isScanningRef.current = true;
          scanner.pause();
          handleTokenScan(decodedText);
        }
      },
      (errorMessage) => { /* ignore per-frame scan errors */ }
    ).catch(err => {
      setError("Could not start camera. Ensure you are on HTTPS or localhost and have granted permissions.");
    });
  };

  // 3. Stop Camera
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
    isScanningRef.current = false;
  };

  // 4. Validate Token via Edge Function
  async function handleTokenScan(token: string) {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ token, organization_id: orgId })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setScanResult({ ...data.member, token });
    } catch (err: any) {
      setError(err.message);
      isScanningRef.current = false;
      if (scannerRef.current?.getState() === 2) scannerRef.current.resume(); // resume if failed
    } finally {
      setLoading(false);
    }
  }

  // 5. Confirm Attendance
  async function confirmAttendance() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ 
          token: scanResult.token, // Note: we need the raw token, let's fix the backend next
          event_id: selectedEvent,
          override: false
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Confirm failed');
      
      alert("Attendance Recorded Successfully!");
      setScanResult(null);
      isScanningRef.current = false;
      if (scannerRef.current) scannerRef.current.resume();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '40rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Scan Attendance</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Event *</label>
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}>
          <option value="">-- Select an open event --</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div id="reader" style={{ width: '100%', borderRadius: '1rem', overflow: 'hidden', background: '#000', minHeight: '300px' }}></div>
      
      {!scannerRef.current && (
        <button onClick={startScanner} style={{ width: '100%', padding: '1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
          Start Camera
        </button>
      )}

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {scanResult && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #10b981', borderRadius: '0.5rem', background: '#ecfdf5' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46' }}>{scanResult.full_name}</h2>
          <p>{scanResult.member_reference} | {scanResult.email}</p>
          
          {scanResult.photo_signed_url ? (
            <img src={scanResult.photo_signed_url} alt="Member" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginTop: '1rem' }} />
          ) : (
            <p style={{ color: 'red', fontSize: '0.875rem' }}>⚠️ No photo available</p>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={confirmAttendance} disabled={loading} style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Recording...' : 'Confirm Attendance'}
            </button>
            <button onClick={() => { setScanResult(null); isScanningRef.current = false; if(scannerRef.current) scannerRef.current.resume(); }} style={{ padding: '0.75rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}