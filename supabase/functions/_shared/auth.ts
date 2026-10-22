import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase service env');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface AuthedUser {
  id: string;
  email: string | null;
  role: string | null;
  org_id: string | null;
}

/** Verify the bearer token and return the user with role claims. */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new HttpError(401, 'Missing bearer token');

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'Invalid token');

  const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: typeof meta.role === 'string' ? meta.role : null,
    org_id: typeof meta.org_id === 'string' ? meta.org_id : null,
  };
}

export async function requirePlatformOwner(req: Request): Promise<AuthedUser> {
  const user = await requireUser(req);
  const svc = getServiceClient();
  const { data } = await svc
    .from('platform_owners')
    .select('id, status, mfa_enabled')
    .eq('id', user.id)
    .maybeSingle();
  if (!data || data.status !== 'active') {
    throw new HttpError(403, 'Not a platform owner');
  }
  if (!data.mfa_enabled) {
    throw new HttpError(403, 'MFA required for platform owner actions');
  }
  return user;
}

export async function requireOrgRole(
  req: Request,
  orgId: string,
  allowed: string[]
): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (user.org_id !== orgId || !user.role || !allowed.includes(user.role)) {
    throw new HttpError(403, 'Insufficient role');
  }
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}