import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

export const photoMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MIN_PHOTO_PX = 300;

export const OrganizationRegisterSchema = z.object({
  name: z.string().trim().min(2).max(200),
  organization_type: z.enum([
    'church','mosque','school','university','company',
    'conference','ngo','government','other',
  ]),
  contact_email: z.string().email().max(200),
  contact_phone: z.string().min(6).max(40),
  address: z.string().min(3).max(500),
  logo_url: z.string().url().max(500).optional(),
  theme_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  admin_email: z.string().email().max(200),
  admin_password: z.string().min(8).max(200),
  admin_full_name: z.string().trim().min(2).max(200),


  contract_duration_months: z
    .number()
    .int()
    .refine(v =>
      [3, 6, 12, 24, 36, 60, 96, 120, 180, 240].includes(v),
      { message: 'Invalid contract duration' }
    ),
  photo_missing_policy: z.enum(['allow_with_flag', 'block']).default('allow_with_flag'),
  accepted_expiry_notice: z.literal(true),
});

export const MemberRegisterFieldsSchema = z.object({
  organization_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(200),
  phone: z.string().min(6).max(40),
  member_reference: z.string().trim().min(1).max(100),
  email: z.string().email().max(200),
  address: z.string().min(3).max(500),
  comment: z.string().max(2000).optional(),
  accepted_privacy_notice: z.literal(true),
});

export const ScanConfirmSchema = z.object({
  token: z.string().min(20).max(200),
  event_id: z.string().uuid(),
  override: z.boolean().default(false),
  override_reason: z.string().max(500).optional(),
});