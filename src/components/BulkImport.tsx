import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { THEME, Button } from './UI';

export default function BulkImport({ orgId, onSuccess }: { orgId: string, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Skip header row if present
    const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;
    const total = dataLines.length;

    let successCount = 0;
    for (let i = 0; i < total; i++) {
      const [fullName, email, phone, memberRef, address] = dataLines[i].split(',').map(s => s.trim());
      if (!fullName || !email || !memberRef) continue;

      const { error } = await supabase.from('organization_memberships').insert({
        organization_id: orgId,
        full_name: fullName,
        email: email,
        phone: phone || '0000000000',
        member_reference: memberRef,
        address: address || 'N/A',
        profile_photo_url: '__deleted__', // Requires photo update later
        status: 'active'
      });

      if (!error) successCount++;
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    alert(`Successfully imported ${successCount} out of ${total} members.`);
    setLoading(false);
    setFile(null);
    setProgress(0);
    onSuccess();
  }

  return (
    <form onSubmit={handleImport} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <input 
        type="file" 
        accept=".csv" 
        onChange={e => setFile(e.target.files?.[0] || null)} 
        style={{ color: THEME.text }} 
      />
      <Button type="submit" variant="primary" disabled={!file || loading}>
        {loading ? `Importing ${progress}%...` : 'Upload CSV'}
      </Button>
    </form>
  );
}