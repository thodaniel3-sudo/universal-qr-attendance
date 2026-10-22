import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Select } from '../components/UI';

declare global { interface Window { jsQR: any; } }

export default function ScannerStandalone() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [output, setOutput] = useState('Point camera at QR code');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scannedMember, setScannedMember] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scanningRef = useRef(true);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      const org = user.app_metadata?.org_id;
      if (org) {
        const { data } = await supabase.from('events').select('id, name').eq('organization_id', org).eq('status', 'open');
        if (data) setEvents(data);
      }
    }
    init();
  }, [navigate]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          animationFrameId = requestAnimationFrame(scanQRCode);
        }
      } catch (err: any) { setOutput("Camera error: " + err.message); }
    }

    async function scanQRCode() {
      if (!scanningRef.current || scannedMember || isProcessingRef.current) {
        animationFrameId = requestAnimationFrame(scanQRCode);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
          if (code && !isProcessingRef.current) {
            if (!selectedEvent) setOutput("⚠️ Select an event first!");
            else { isProcessingRef.current = true; await validateToken(code.data.trim()); }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanQRCode);
    }

    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js";
      script.onload = () => startCamera();
      document.body.appendChild(script);
    } else startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [selectedEvent, scannedMember]);

  async function validateToken(scannedData: string) {
    // Extract token if a full URL was scanned (e.g. https://.../scan/abc123)
    let token = scannedData;
    if (scannedData.includes('/scan/')) {
      token = scannedData.split('/scan/')[1];
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Save the clean token, not the URL, for the confirm step
      setScannedMember({ ...data.member, rawToken: token });
      setOutput("✅ Identity found. Verify photo before confirming.");
    } catch (err: any) {
      setOutput("❌ " + err.message);
      setTimeout(() => { setOutput("Point camera at QR code"); isProcessingRef.current = false; }, 3000);
    }
  }

  async function confirmAttendance() {
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ token: scannedMember.rawToken, event_id: selectedEvent, override: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Attendance Recorded Successfully!");
      resetScanner();
    } catch (err: any) {
      alert("Error: " + err.message);
      setIsProcessing(false);
    }
  }

  function resetScanner() {
    setScannedMember(null); setIsProcessing(false); isProcessingRef.current = false; setOutput("Point camera at QR code");
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: THEME.bg, minHeight: '100vh', padding: '2rem', color: THEME.text, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Select label="Select Event to Scan For *" value={selectedEvent} onChange={(e:any) => setSelectedEvent(e.target.value)} style={{ marginBottom: '1.5rem', borderColor: '#ffcc00' }}>
          <option value="">-- Choose an Event --</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>

        {!scannedMember ? (
          <Card style={{ textAlign: 'center' }}>
            <h1 style={{ color: THEME.text, fontSize: '1.5rem', marginBottom: '1rem' }}>QR Scanner</h1>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', border: `2px solid ${THEME.primary}`, borderRadius: '12px', marginBottom: '1rem' }}></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', color: THEME.textMuted }}>{output}</p>
          </Card>
        ) : (
          <Card style={{ textAlign: 'center' }}>
            <h2 style={{ color: THEME.success, marginBottom: '1rem' }}>Verify Identity</h2>
            {scannedMember.photo_url ? (
              <img src={scannedMember.photo_url} alt="Profile" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', border: `4px solid ${THEME.success}`, marginBottom: '1rem' }} />
            ) : (
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: THEME.input, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted }}>No Photo</div>
            )}
            <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{scannedMember.full_name}</h3>
            <p style={{ color: THEME.textMuted, marginBottom: '0.25rem' }}>ID: {scannedMember.member_reference}</p>
            <p style={{ color: THEME.textMuted, marginBottom: '1.5rem' }}>Email: {scannedMember.email}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button variant="success" onClick={confirmAttendance} disabled={isProcessing} style={{ flex: 1 }}>{isProcessing ? 'Saving...' : 'Confirm'}</Button>
              <Button variant="danger" onClick={resetScanner} disabled={isProcessing} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </Card>
        )}

        <Button variant="outline" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: '2rem', width: '100%' }}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}