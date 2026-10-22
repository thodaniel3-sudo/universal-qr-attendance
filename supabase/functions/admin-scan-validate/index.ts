import { getServiceClient, requireOrgRole, HttpError } from '../_shared/auth.ts';
import { jsonResponse, corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { token, organization_id } = await req.json();
    if (!token || typeof token !== 'string') {
      return jsonResponse({ error: 'Invalid token' }, 400);
    }

    const user = await requireOrgRole(req, organization_id, [
      'organization_owner',
      'organization_administrator',
      'attendance_officer',
    ]);

    const svc = getServiceClient();

    // Contract must be active
    const { data: org } = await svc
      .from('organizations')
      .select('id, contract_status, is_archived')
      .eq('id', organization_id)
      .maybeSingle();
    if (!org || org.contract_status !== 'active' || org.is_archived) {
      return jsonResponse({ error: 'Organization contract is not active.' }, 403);
    }

    // Hash and look up
    const hash = await sha256Hex(token);
    const { data: qr } = await svc
      .from('qr_credentials')
      .select('id, member_id, status')
      .eq('token_hash', hash)
      .maybeSingle();

    if (!qr || qr.status !== 'active') {
      return jsonResponse({ error: 'Invalid or revoked QR code.' }, 404);
    }

    const { data: member } = await svc
      .from('organization_memberships')
      .select('id, organization_id, full_name, member_reference, phone, email, address, profile_photo_url, status')
      .eq('id', qr.member_id)
      .maybeSingle();

    if (!member || member.organization_id !== organization_id) {
      // Token belongs to another organization — do not leak existence.
      return jsonResponse({ error: 'Invalid or revoked QR code.' }, 404);
    }

    if (member.status !== 'active') {
      return jsonResponse({
        error: 'Member is inactive.',
        state: 'inactive_member',
      }, 409);
    }

    // Photo presence
    const photoDeleted = member.profile_photo_url.startsWith('__deleted');
    let photoSignedUrl: string | null = null;
    if (!photoDeleted) {
      const { data: signed } = await svc.storage
        .from('member-photos')
        .createSignedUrl(member.profile_photo_url, 300);
      photoSignedUrl = signed?.signedUrl ?? null;
    }

    // Audit photo access at the point of reveal
    await svc.from('audit_logs').insert({
      organization_id,
      actor_user_id: user.id,
      actor_role: user.role,
      action: 'photo_viewed_during_scan',
      target_type: 'organization_membership',
      target_id: member.id,
    });

    return jsonResponse({
      state: photoDeleted ? 'photo_missing' : 'ok',
      member: {
        id: member.id,
        full_name: member.full_name,
        member_reference: member.member_reference,
        phone: member.phone,
        email: member.email,
        address: member.address,
        photo_signed_url: photoSignedUrl,
      },
    });
  } catch (e) {
    if (e instanceof HttpError) return jsonResponse({ error: e.message }, e.status);
    console.error(e);
    return jsonResponse({ error: 'Unexpected error.' }, 500);
  }
});

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}