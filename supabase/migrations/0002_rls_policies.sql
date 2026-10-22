-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table organizations           enable row level security;
alter table platform_owners          enable row level security;
alter table profiles                 enable row level security;
alter table organization_memberships enable row level security;
alter table qr_credentials           enable row level security;
alter table events                   enable row level security;
alter table attendance_records       enable row level security;
alter table audit_logs               enable row level security;
alter table organization_settings    enable row level security;
alter table contract_events          enable row level security;

-- =========================================================================
-- Helper functions (SECURITY DEFINER) — used by policies below
-- =========================================================================

-- Is the current user a Platform Owner?
create or replace function is_platform_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from platform_owners
    where id = auth.uid() and status = 'active'
  );
$$;

-- Does the current user belong to this organization with one of the given roles?
-- Roles are stored in profiles via JWT claims OR in a helper table.
-- For this implementation we use the JWT app_metadata.role and app_metadata.org_id.
create or replace function has_org_role(org uuid, roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select
    coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid = org
      and (auth.jwt() -> 'app_metadata' ->> 'role') = any(roles),
      false
    );
$$;

-- Is the current user an organization administrator (owner or admin)?
create or replace function is_org_admin(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select has_org_role(org, array['organization_owner','organization_administrator']);
$$;

-- Is the current user any org-level staff (admins, officers, auditors)?
create or replace function is_org_staff(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select has_org_role(org, array[
    'organization_owner','organization_administrator',
    'attendance_officer','read_only_auditor'
  ]);
$$;

-- Is the organization's contract active (writes allowed)?
create or replace function org_is_writable(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organizations
    where id = org and contract_status = 'active'
  );
$$;

-- =========================================================================
-- platform_owners
-- =========================================================================
create policy "platform_owners_self_select"
  on platform_owners for select
  using (auth.uid() = id or is_platform_owner());

create policy "platform_owners_owner_write"
  on platform_owners for all
  using (is_platform_owner())
  with check (is_platform_owner());

-- =========================================================================
-- organizations
-- =========================================================================
-- Public can read only active orgs' minimal fields via the API endpoint.
-- No direct SELECT policy for anon. The public list goes through an Edge Function
-- that uses the service role and returns only safe fields.

create policy "orgs_platform_owner_all"
  on organizations for all
  using (is_platform_owner())
  with check (is_platform_owner());

create policy "orgs_staff_select"
  on organizations for select
  using (is_org_staff(id));

create policy "orgs_owner_update"
  on organizations for update
  using (has_org_role(id, array['organization_owner','organization_administrator']))
  with check (has_org_role(id, array['organization_owner','organization_administrator']));

-- =========================================================================
-- profiles
-- =========================================================================
create policy "profiles_self"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_platform_owner"
  on profiles for all
  using (is_platform_owner())
  with check (is_platform_owner());

-- =========================================================================
-- organization_memberships
-- =========================================================================
create policy "memberships_platform_owner_all"
  on organization_memberships for all
  using (is_platform_owner())
  with check (is_platform_owner());

create policy "memberships_staff_select"
  on organization_memberships for select
  using (is_org_staff(organization_id));

create policy "memberships_admin_insert"
  on organization_memberships for insert
  with check (
    is_org_admin(organization_id)
    and org_is_writable(organization_id)
  );

create policy "memberships_admin_update"
  on organization_memberships for update
  using (is_org_admin(organization_id) and org_is_writable(organization_id))
  with check (is_org_admin(organization_id) and org_is_writable(organization_id));

create policy "memberships_member_self_select"
  on organization_memberships for select
  using (user_id = auth.uid());

-- =========================================================================
-- qr_credentials — never readable/writable by clients.
-- Only the scan Edge Functions (service role) may touch these.
-- =========================================================================
create policy "qr_platform_owner_select"
  on qr_credentials for select
  using (is_platform_owner());

-- =========================================================================
-- events
-- =========================================================================
create policy "events_platform_owner_all"
  on events for all
  using (is_platform_owner())
  with check (is_platform_owner());

create policy "events_staff_select"
  on events for select
  using (is_org_staff(organization_id));

create policy "events_admin_write"
  on events for all
  using (is_org_admin(organization_id) and org_is_writable(organization_id))
  with check (is_org_admin(organization_id) and org_is_writable(organization_id));

-- =========================================================================
-- attendance_records
-- =========================================================================
create policy "attendance_platform_owner_select"
  on attendance_records for select
  using (is_platform_owner());

create policy "attendance_staff_select"
  on attendance_records for select
  using (is_org_staff(organization_id));

create policy "attendance_member_self_select"
  on attendance_records for select
  using (
    exists (
      select 1 from organization_memberships m
      where m.id = attendance_records.member_id and m.user_id = auth.uid()
    )
  );

-- Inserts are done exclusively through the scan-confirm Edge Function
-- using the service role, which bypasses RLS after performing its own
-- authorization checks. No client INSERT policy exists by design.

-- =========================================================================
-- audit_logs
-- =========================================================================
create policy "audit_platform_owner_select"
  on audit_logs for select
  using (is_platform_owner());

create policy "audit_org_admin_select"
  on audit_logs for select
  using (
    organization_id is not null
    and has_org_role(organization_id, array['organization_owner','organization_administrator','read_only_auditor'])
  );

-- Inserts are done by the server. No client insert policy.

-- =========================================================================
-- organization_settings
-- =========================================================================
create policy "settings_platform_owner_all"
  on organization_settings for all
  using (is_platform_owner())
  with check (is_platform_owner());

create policy "settings_staff_select"
  on organization_settings for select
  using (is_org_staff(organization_id));

create policy "settings_admin_write"
  on organization_settings for all
  using (is_org_admin(organization_id) and org_is_writable(organization_id))
  with check (is_org_admin(organization_id) and org_is_writable(organization_id));

-- =========================================================================
-- contract_events
-- =========================================================================
create policy "contract_events_platform_owner_select"
  on contract_events for select
  using (is_platform_owner());

create policy "contract_events_org_owner_select"
  on contract_events for select
  using (has_org_role(organization_id, array['organization_owner']));