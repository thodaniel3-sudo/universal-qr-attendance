import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuditInput {
  organization_id: string | null;
  actor_user_id: string | null;
  actor_role:
    | 'platform_owner'
    | 'organization_owner'
    | 'organization_administrator'
    | 'attendance_officer'
    | 'read_only_auditor'
    | 'system';
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

export async function audit(svc: SupabaseClient, input: AuditInput) {
  const { error } = await svc.from('audit_logs').insert({
    organization_id: input.organization_id,
    actor_user_id: input.actor_user_id,
    actor_role: input.actor_role,
    action: input.action,
    target_type: input.target_type ?? null,
    target_id: input.target_id ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) console.error('AUDIT FAILED', error.message);
}