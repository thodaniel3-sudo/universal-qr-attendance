import { getServiceClient } from '../_shared/auth.ts';
import { jsonResponse } from '../_shared/cors.ts';
import { audit } from '../_shared/audit.ts';

/**
 * Runs daily. Steps:
 *  1. Expire: delete photos & QR codes, status → expired
 *  2. Export: CSV to org contact email, status → archived
 *  3. Delete: after GRACE_PERIOD_DAYS, purge structured data
 */
Deno.serve(async (req) => {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Forbidden', { status: 403 });
  }
  const svc = getServiceClient();
  const graceDays = Number(Deno.env.get('GRACE_PERIOD_DAYS') ?? 90);
  const results = { expired: 0, exported: 0, deleted: 0, errors: [] as string[] };

  // STEP 1 — expire active contracts past expiry
  const { data: toExpire } = await svc
    .from('organizations')
    .select('id, contact_email, name')
    .eq('contract_status', 'active')
    .lte('contract_expires_at', new Date().toISOString());

  for (const org of toExpire ?? []) {
    try {
      // Delete photos
      const { data: members } = await svc
        .from('organization_memberships')
        .select('id, profile_photo_url')
        .eq('organization_id', org.id)
        .not('profile_photo_url', 'like', '__deleted%');
      const paths = (members ?? []).map((m) => m.profile_photo_url).filter(Boolean);
      if (paths.length) {
        await svc.storage.from('member-photos').remove(paths);
      }
      await svc
        .from('organization_memberships')
        .update({ profile_photo_url: '__deleted_at_contract_expiry__' })
        .eq('organization_id', org.id);

      // Revoke QR codes
      await svc.from('qr_credentials').delete().eq('organization_id', org.id);

      await svc
        .from('organizations')
        .update({ contract_status: 'expired' })
        .eq('id', org.id);

      await svc.from('contract_events').insert([
        { organization_id: org.id, event_type: 'expired' },
        { organization_id: org.id, event_type: 'photos_deleted' },
        { organization_id: org.id, event_type: 'qr_credentials_deleted' },
      ]);

      await audit(svc, {
        organization_id: org.id,
        actor_user_id: null,
        actor_role: 'system',
        action: 'contract_expired',
        metadata: { photos_deleted: paths.length },
      });

      results.expired++;
    } catch (e) {
      results.errors.push(`expire ${org.id}: ${(e as Error).message}`);
    }
  }

  // STEP 2 — export + archive
  const { data: toExport } = await svc
    .from('organizations')
    .select('id, contact_email, name')
    .eq('contract_status', 'expired');

  for (const org of toExport ?? []) {
    try {
      const csv = await buildCsv(svc, org.id);
      const sent = await sendEmail(org.contact_email, `Your data export — ${org.name}`, csv);
      if (sent) {
        await svc.from('contract_events').insert({
          organization_id: org.id, event_type: 'csv_exported',
        });
        await svc
          .from('organizations')
          .update({ contract_status: 'archived', is_archived: true })
          .eq('id', org.id);
        results.exported++;
      } else {
        await svc.from('contract_events').insert({
          organization_id: org.id, event_type: 'csv_export_failed',
        });
      }
    } catch (e) {
      results.errors.push(`export ${org.id}: ${(e as Error).message}`);
    }
  }

  // STEP 3 — delete archived data after grace period
  const cutoff = new Date(Date.now() - graceDays * 86400000).toISOString();
  const { data: toDelete } = await svc
    .from('organizations')
    .select('id, contact_email, name')
    .eq('contract_status', 'archived')
    .not('id', 'in',
      `(select organization_id from contract_events where event_type='csv_exported' and created_at > '${cutoff}')`
    );

  for (const org of toDelete ?? []) {
    try {
      await svc.from('attendance_records').delete().eq('organization_id', org.id);
      await svc.from('events').delete().eq('organization_id', org.id);
      await svc.from('organization_memberships').delete().eq('organization_id', org.id);
      await svc.from('organization_settings').delete().eq('organization_id', org.id);
      await svc
        .from('organizations')
        .update({ contract_status: 'deleted' })
        .eq('id', org.id);
      await svc.from('contract_events').insert({
        organization_id: org.id, event_type: 'archived_data_deleted',
      });
      await sendEmail(
        org.contact_email,
        `Archived data permanently deleted — ${org.name}`,
        'Your archived structured data has been permanently deleted. The CSV email previously sent is your only copy.'
      );
      results.deleted++;
    } catch (e) {
      results.errors.push(`delete ${org.id}: ${(e as Error).message}`);
    }
  }

  return jsonResponse(results);
});

async function buildCsv(svc: any, organizationId: string): Promise<string> {
  const { data: members } = await svc
    .from('organization_memberships')
    .select('id, member_reference, full_name, phone, email, address, status, created_at')
    .eq('organization_id', organizationId);
  const { data: attendance } = await svc
    .from('attendance_records')
    .select('member_id, event_id, checked_in_at, attendance_status, photo_verified, events(name)')
    .eq('organization_id', organizationId);

  const lines: string[] = [];
  lines.push('section,member_reference,full_name,phone,email,address,status,event,checked_in_at');
  for (const m of members ?? []) {
    lines.push(
      [
        'member', csv(m.member_reference), csv(m.full_name), csv(m.phone),
        csv(m.email), csv(m.address), csv(m.status), '', '',
      ].join(',')
    );
  }
  for (const a of attendance ?? []) {
    const mem = (members ?? []).find((m: any) => m.id === a.member_id);
    lines.push(
      [
        'attendance', csv(mem?.member_reference ?? ''), csv(mem?.full_name ?? ''),
        '', '', '', '', csv(a.events?.name ?? a.event_id),
        csv(a.checked_in_at),
      ].join(',')
    );
  }
  return lines.join('\n');
}

function csv(v: unknown): string {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // Replace with your SMTP/Resend/Postmark integration.
  console.log('EMAIL', { to, subject, bodyLength: body.length });
  return true;
}