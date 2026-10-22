import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Org { name: string; organization_type: string; slug: string }

export function OrganizationSelector({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (slug: string | null) => void;
  error?: string;
}) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-organizations-list`;
      const res = await fetch(url, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      });
      const body = await res.json().catch(() => ({ organizations: [] }));
      if (!cancelled) {
        setOrgs(body.organizations ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(s) ||
        o.organization_type.toLowerCase().includes(s)
    );
  }, [orgs, q]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Organization <span className="text-red-600">*</span>
      </label>
      <input
        type="search"
        placeholder="Search by name or type…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full border rounded-md px-3 py-2"
      />
      {loading ? (
        <div className="text-sm text-gray-500">Loading organizations…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-500">No organizations match.</div>
      ) : (
        <ul className="max-h-64 overflow-auto border rounded-md">
          {filtered.map((o) => (
            <li key={o.slug}>
              <button
                type="button"
                onClick={() => onChange(o.slug)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                  value === o.slug ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-gray-500 capitalize">{o.organization_type}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}