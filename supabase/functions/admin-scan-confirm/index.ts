import { getServiceClient, requireOrgRole, HttpError } from '../_shared/auth.ts';
import { jsonResponse, corsHeaders } from '../_shared/cors.ts';
import { ScanConfirmSchema } from '../_shared/validate.ts';
import { audit } from '../_shared/audit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const parsed = ScanConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }
    const { token, event_id, override, override_reason } = parsed.data;

    const svc = getServiceClient();

    // Look up the event first so we can authorize against its organization
    const { data: event } = await svc
      .from('events')
      .select('id, organization_id, status, attendance_opens_at, attendance_closes_at')
      .eq('id', event_id)
      .maybeSingle();
    if (!event) return jsonResponse({ error: 'Event not found' }, 404);

    const user = await requireOrgRole(req, event.organization_id, [
      'organization_owner',
      'organization_administrator',
      'attendance_officer',
    ]);

    // Override permission check
    if (override && !['organization_owner', 'organization_administrator'].includes(user.role!)) {
      throw new HttpError(403, 'You are not permitted to override photo verification.');
    }

    // Contract active
    const { data: org } = await svc
      .from('organizations')
      .select('contract_status, is_archived')
      .eq('id', event.organization_id)
      .maybeSingle();
    if (!org || org.contract_status !== 'active' || org.is_archived) {
      return jsonResponse({ error: 'Organization contract is not active.' }, 403);
    }

    // Event open
    const now = new Date();
    if (event.status !== 'open') {
      return jsonResponse({ error: 'Event is not open for attendance.' }, 409);
    }
    if (event.attendance_closes_at && new Date(event.attendance_closes_at) < now) {
      return jsonResponse({ error: 'Attendance window has closed.' }, 409);
    }
    if (event.attendance_opens_at && new Date(event.attendance_opens_at) > now) {
      return jsonResponse({ error: 'Attendance window has not opened.' }, 409);
    }

    // Token → member
    const hash = await sha256Hex(token);
    const { data: qr } = await svc
      .from('qr_credentials')
      .select('member_id, status')
      .eq('token_hash', hash)
      .maybeSingle();
    if (!qr || qr.status !== 'active') {
      return jsonResponse({ error: 'Invalid or revoked QR code.' }, 404);
    }

    const { data: member } = await svc
      .from('organization_memberships')
      .select('id, organization_id, status, profile_photo_url')
      .eq('id', qr.member_id)
      .maybeSingle();
    if (!member || member.organization_id !== event.organization_id) {
      return jsonResponse({ error: 'Invalid or revoked QR code.' }, 404);
    }
    if (member.status !== 'active') {
      return jsonResponse({ error: 'Member is inactive.' }, 409);
    }

    const photoMissing = member.profile_photo_url.startsWith('__deleted');
    if (photoMissing && !override) {
      return jsonResponse({
        error: 'Photo is missing. An administrator must confirm attendance with override.',
        requires_override: true,
      }, 409);
    }

    // Insert attendance — unique (event_id, member_id) enforces no duplicates
    const { error: insErr } = await svc.from('attendance_records').insert({
      organization_id: event.organization_id,
      event_id: event.id,
      member_id: member.id,
      checked_in_by: user.id,
      photo_verified: !photoMissing && !override,
      override_reason: override ? (override_reason ?? 'override') : null,
    });

    if (insErr) {
      if (insErr.code === '23505') {
        return jsonResponse({ error: 'Attendance already recorded.', state: 'already_checked_in' }, 409);
      }
      console.error(insErr);
      return jsonResponse({ error: 'Failed to record attendance.' }, 500);
    }

    await audit(svc, {
      organization_id: event.organization_id,
      actor_user_id: user.id,
      actor_role: user.role as any,
      action: override ? 'attendance_override' : 'attendance_confirmed',
      target_type: 'organization_membership',
      target_id: member.id,
      metadata: { event_id: event.id, override_reason: override ? override_reason : null },
    });

    return jsonResponse({ ok: true, state: 'recorded' });
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