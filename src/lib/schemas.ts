import { z } from 'zod';

export const OrganizationSelectorSchema = z.object({
  organization_id: z.string().uuid({ message: 'Select an organization.' }),
});

export const MemberRegisterSchema = z.object({
  organization_id: z.string().uuid({ message: 'Select an organization.' }),
  full_name: z.string().trim().min(2, 'Full name is required.').max(200),
  phone: z.string().trim().min(6, 'Valid phone required.').max(40),
  member_reference: z.string().trim().min(1, 'ID number is required.').max(100),
  email: z.string().email('Valid email required.').max(200),
  address: z.string().trim().min(3, 'Address is required.').max(500),
  comment: z.string().max(2000).optional(),
  accepted_privacy_notice: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy notice.' }),
  }),
  photo: z
    .custom<File>((v) => v instanceof File, { message: 'Profile photograph is required.' })
    .refine((f) => f.size > 0 && f.size <= 5 * 1024 * 1024, {
      message: 'Photo must be under 5 MB.',
    })
    .refine((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type), {
      message: 'Photo must be JPG, PNG, or WebP.',
    }),
});

export type MemberRegisterInput = z.infer<typeof MemberRegisterSchema>;

export const CONTRACT_OPTIONS = [
  { months: 3,   label: '3 months'  },
  { months: 6,   label: '6 months'  },
  { months: 12,  label: '1 year'    },
  { months: 24,  label: '2 years'   },
  { months: 60,  label: '5 years'   },
  { months: 120, label: '10 years'  },
  { months: 180, label: '15 years'  },
] as const;