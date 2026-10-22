import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MemberRegisterSchema, type MemberRegisterInput } from '../../lib/schemas';
import { OrganizationSelector } from '../../components/forms/OrganizationSelector';
import { PhotoUpload } from '../../components/forms/PhotoUpload';
import { useNavigate } from 'react-router-dom';

export function MemberRegister() {
  const navigate = useNavigate();
  const {
    register, handleSubmit, setValue, watch, formState: { errors, isSubmitting },
  } = useForm<MemberRegisterInput>({
    resolver: zodResolver(MemberRegisterSchema),
  });
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const photo = watch('photo');

  // Resolve slug → organization_id before submit by looking up the list again
  async function onSubmit(values: MemberRegisterInput) {
    setServerError(null);
    if (!orgSlug) { setServerError('Please select an organization.'); return; }

    const listRes = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-organizations-list`,
      { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } }
    );
    const { organizations } = await listRes.json();
    // NOTE: the public list does not expose UUIDs by design. We submit by slug,
    // and the registration function resolves the slug to the organization row.
    const form = new FormData();
    form.append('organization_slug', orgSlug);
    form.append('full_name', values.full_name);
    form.append('phone', values.phone);
    form.append('member_reference', values.member_reference);
    form.append('email', values.email);
    form.append('address', values.address);
    if (values.comment) form.append('comment', values.comment);
    form.append('accepted_privacy_notice', String(values.accepted_privacy_notice));
    form.append('photo', values.photo);

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-member-register`,
      {
        method: 'POST',
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: form,
      }
    );
    const body = await res.json();
    if (!res.ok) {
      setServerError(body.error ?? 'Registration failed.');
      return;
    }
    navigate('/register/success', {
      state: { member: body.member, qr_token: body.qr_token },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto space-y-4 p-4">
      <h1 className="text-2xl font-bold">Register as a member</h1>

      <OrganizationSelector
        value={orgSlug}
        onChange={(s) => { setOrgSlug(s); }}
        error={!orgSlug ? 'Organization is required.' : undefined}
      />

      <Field label="Full name" error={errors.full_name?.message}>
        <input {...register('full_name')} className="input" />
      </Field>
      <Field label="Phone number" error={errors.phone?.message}>
        <input {...register('phone')} inputMode="tel" className="input" />
      </Field>
      <Field label="Identification / Matriculation number" error={errors.member_reference?.message}>
        <input {...register('member_reference')} className="input" />
      </Field>
      <Field label="Email address" error={errors.email?.message}>
        <input {...register('email')} type="email" className="input" />
      </Field>
      <Field label="Address" error={errors.address?.message}>
        <textarea {...register('address')} className="input" rows={2} />
      </Field>
      <Field label="Comment (optional)" error={errors.comment?.message}>
        <textarea {...register('comment')} className="input" rows={2} />
      </Field>

      <PhotoUpload
        value={photo ?? null}
        onChange={(f) => setValue('photo', f as any, { shouldValidate: true })}
        error={errors.photo?.message as string | undefined}
      />

      <label className="flex gap-2 text-sm">
        <input type="checkbox" {...register('accepted_privacy_notice')} />
        <span>
          I have read and accept the privacy notice. I understand my photograph will be
          permanently deleted when the organization's contract expires.
        </span>
      </label>
      {errors.accepted_privacy_notice && (
        <p className="text-sm text-red-600">{errors.accepted_privacy_notice.message}</p>
      )}

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-md disabled:opacity-60"
      >
        {isSubmitting ? 'Registering…' : 'Register'}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}