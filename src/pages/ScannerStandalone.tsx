import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

declare global {
  interface Window { jsQR: any; }
}

export default function ScannerStandalone() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [output, setOutput] = useState('Scan a QR code by pointing your camera at it.');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  // Use Refs for values needed inside the animation loop so they never go stale
  const scanningRef = useRef(true);
  const isProcessingRef = useRef(false);
  const selectedEventRef = useRef('');
  const orgIdRef = useRef<string | null>(null);

  // Keep the ref updated whenever the user changes the dropdown
  useEffect(() => {
    selectedEventRef.current = selectedEvent;
  }, [selectedEvent]);

  // 1. Load User & Events
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      
      const org = user.app_metadata?.org_id;
      orgIdRef.current = org;

      if (org) {
        const { data } = await supabase
          .from('events')
          .select('id, name')
          .eq('organization_id', org)
          .eq('status', 'open');
        if (data) {
          setEvents(data);
        }
      }
    }
    init();
  }, [navigate]);

  // 2. Camera Logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          animationFrameId = requestAnimationFrame(scanQRCode);
        }
      } catch (err: any) {
        setOutput("Error accessing camera: " + err.message);
      }
    }

    async function scanQRCode() {
      if (!scanningRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth", // Try both dark-on-light and light-on-dark
          });

          if (code && !isProcessingRef.current) {
            const scannedData = code.data.trim();
            
            if (!selectedEventRef.current) {
              // Don't pause, just warn them quickly
              setOutput("⚠️ Please select an event first!");
            } else {
              // PAUSE SCANNING and process
              isProcessingRef.current = true;
              setOutput("QR Code detected: " + scannedData);
              await handleTokenScan(scannedData);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanQRCode);
    }

    // Load the jsQR library dynamically from the CDN
    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js";
      script.onload = () => startCamera();
      document.body.appendChild(script);
    } else {
      startCamera();
    }

    return () => {
      scanningRef.current = false;
      cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []); // <-- Empty dependency array means this only runs ONCE on mount

  // 3. Send Token to Supabase
  async function handleTokenScan(token: string) {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ token, event_id: selectedEventRef.current, override: false })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Confirm failed');
      
      setOutput("✅ Attendance Recorded Successfully!");
      alert("Attendance Recorded Successfully!");
      
    } catch (err: any) {
      setOutput("❌ " + err.message);
      alert(err.message);
    } finally {
      // RESUME SCANNING after 3 seconds
      setTimeout(() => {
        isProcessingRef.current = false;
        setOutput("Scan a QR code by pointing your camera at it.");
      }, 3000);
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      
      <h1 style={{ color: '#ffcc00' }}>QR Code Scanner</h1>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Event *</label>
        <select 
          value={selectedEvent} 
          onChange={e => setSelectedEvent(e.target.value)} 
          style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', border: '2px solid #ffcc00', background: '#000', color: '#fff', minWidth: '250px' }}
        >
          <option value="">-- Choose an Event --</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          style={{ width: '100%', maxWidth: '400px', border: '2px solid #ffcc00', borderRadius: '12px', marginBottom: '1rem' }}
        ></video>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>

      <p style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffcc00' }}>
        {output}
      </p>

      <button 
        onClick={() => navigate('/admin/dashboard')}
        style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}