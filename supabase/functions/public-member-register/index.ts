import { getServiceClient } from '../_shared/auth.ts';
import { jsonResponse, corsHeaders } from '../_shared/cors.ts';
import {
  MemberRegisterFieldsSchema,
  MAX_PHOTO_BYTES,
  photoMimeTypes,
} from '../_shared/validate.ts';
import { audit } from '../_shared/audit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const form = await req.formData();
    const photo = form.get('photo');
    
    if (!(photo instanceof File)) {
      return jsonResponse({ error: 'Profile photograph is required.' }, 400);
    }
    if (photo.size <= 0 || photo.size > MAX_PHOTO_BYTES) {
      return jsonResponse({ error: 'Invalid photo size. Maximum is 5 MB.' }, 400);
    }
    if (!photoMimeTypes.includes(photo.type as any)) {
      return jsonResponse({ error: 'Photo must be JPG, PNG, or WebP.' }, 400);
    }

    const parsed = MemberRegisterFieldsSchema.safeParse({
      organization_id: form.get('organization_id'),
      full_name: form.get('full_name'),
      phone: form.get('phone'),
      member_reference: form.get('member_reference'),
      email: form.get('email'),
      address: form.get('address'),
      comment: form.get('comment') || undefined,
      accepted_privacy_notice: form.get('accepted_privacy_notice') === 'true',
    });
    
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid form', details: parsed.error.flatten() }, 400);
    }
    const fields = parsed.data;
    const svc = getServiceClient();

    // 1) Verify organization exists and is active
    const { data: org } = await svc
      .from('organizations')
      .select('id, contract_status, is_archived')
      .eq('id', fields.organization_id)
      .maybeSingle();
      
    if (!org || org.contract_status !== 'active' || org.is_archived) {
      return jsonResponse({ error: 'Organization is not accepting registrations.' }, 400);
    }

    // 2) Duplicate detection within the same organization
    const { data: dup } = await svc
      .from('organization_memberships')
      .select('id')
      .eq('organization_id', fields.organization_id)
      .or(
        `member_reference.eq.${encode(fields.member_reference)},email.eq.${encode(fields.email)},phone.eq.${encode(fields.phone)}`
      )
      .limit(1);
      
    if (dup && dup.length > 0) {
      return jsonResponse(
        { error: 'A member with this ID, email, or phone is already registered.' },
        409
      );
    }

    // 3) Upload to private bucket
    const buf = new Uint8Array(await photo.arrayBuffer());
    const ext = photo.type === 'image/png' ? 'png'
      : photo.type === 'image/webp' ? 'webp'
      : 'jpg';
    const objectPath = `${fields.organization_id}/${crypto.randomUUID()}.${ext}`;
    
    const { error: upErr } = await svc.storage
      .from('member-photos')
      .upload(objectPath, buf, { contentType: photo.type, upsert: false });
      
    if (upErr) {
      console.error(upErr);
      return jsonResponse({ error: 'Photo upload failed. Ensure the "member-photos" bucket exists and is private.' }, 500);
    }

    // 4) Insert membership
    const { data: membership, error: memErr } = await svc
      .from('organization_memberships')
      .insert({
        organization_id: fields.organization_id,
        member_reference: fields.member_reference,
        full_name: fields.full_name,
        phone: fields.phone,
        email: fields.email,
        address: fields.address,
        profile_photo_url: objectPath,
        comment: fields.comment ?? null,
        status: 'active',
      })
      .select('id, full_name, member_reference')
      .single();
      
    if (memErr || !membership) {
      await svc.storage.from('member-photos').remove([objectPath]);
      console.error(memErr);
      return jsonResponse({ error: 'Registration failed.' }, 500);
    }

    // 5) Generate QR token (Just the raw token, no URL)
    const rawToken = crypto.getRandomValues(new Uint8Array(32));
    const token = base64url(rawToken);
    const tokenHash = await sha256Hex(token);

    const { error: qrErr } = await svc.from('qr_credentials').insert({
      organization_id: fields.organization_id,
      member_id: membership.id,
      token_hash: tokenHash,
      status: 'active',
    });
    
    if (qrErr) {
      console.error(qrErr);
      return jsonResponse({
        error: 'Registered, but QR generation failed. Contact administrator.',
      }, 500);
    }

    await audit(svc, {
      organization_id: fields.organization_id,
      actor_user_id: null,
      actor_role: 'system',
      action: 'member_registered',
      target_type: 'organization_membership',
      target_id: membership.id,
    });

    // Return the raw token to the frontend for image generation
    return jsonResponse({
      member: {
        id: membership.id,
        full_name: membership.full_name,
        member_reference: membership.member_reference,
      },
      qr_token: token,
    }, 201);
    
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Unexpected error.' }, 500);
  }
});

function encode(v: string) {
  return encodeURIComponent(v.replace(/[',]/g, ''));
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}