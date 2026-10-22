-- =========================================================================
-- Universal QR Attendance — Initial Schema
-- =========================================================================
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- ENUMS ----------
create type organization_type as enum (
  'church','mosque','school','university','company',
  'conference','ngo','government','other'
);

create type contract_status as enum ('active','expired','archived','deleted');

create type membership_status as enum ('active','inactive','suspended');

create type qr_status as enum ('active','revoked','expired');

create type event_status as enum ('draft','open','closed','archived');

create type photo_missing_policy as enum ('allow_with_flag','block');

create type actor_role as enum (
  'platform_owner','organization_owner','organization_administrator',
  'attendance_officer','read_only_auditor','system'
);

-- ---------- ORGANIZATIONS ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  logo_url text,
  organization_type organization_type not null,
  contact_email citext not null,
  contact_phone text not null,
  address text not null,
  timezone text not null default 'Africa/Lagos',
  contract_duration_months integer not null check (contract_duration_months > 0),
  contract_started_at timestamptz not null default now(),
  contract_expires_at timestamptz not null,
  contract_status contract_status not null default 'active',
  is_archived boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_status_expiry_idx
  on organizations (contract_status, contract_expires_at);

create index organizations_type_name_idx
  on organizations (organization_type, name);

-- ---------- PLATFORM OWNERS ----------
create table platform_owners (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email citext not null,
  mfa_enabled boolean not null default false,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PROFILES (auth-linked users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email citext not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ORGANIZATION MEMBERSHIPS ----------
create table organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  member_reference citext not null,
  full_name text not null,
  phone text not null,
  email citext not null,
  address text not null,
  profile_photo_url text not null
    check (length(trim(profile_photo_url)) > 0),
  comment text,
  status membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, member_reference)
);

create index memberships_org_status_idx
  on organization_memberships (organization_id, status);
create index memberships_org_email_idx
  on organization_memberships (organization_id, email);
create index memberships_org_phone_idx
  on organization_memberships (organization_id, phone);

-- ---------- QR CREDENTIALS ----------
create table qr_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references organization_memberships(id) on delete cascade,
  token_hash text not null,
  status qr_status not null default 'active',
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index qr_token_hash_idx on qr_credentials (token_hash);

-- ---------- EVENTS ----------
create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  attendance_opens_at timestamptz,
  attendance_closes_at timestamptz,
  status event_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_org_start_idx on events (organization_id, starts_at);

-- ---------- ATTENDANCE RECORDS ----------
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references organization_memberships(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id) on delete set null,
  attendance_status text not null default 'present',
  photo_verified boolean not null default true,
  override_reason text,
  notes text,
  created_at timestamptz not null default now(),
  unique (event_id, member_id),
  check (
    (photo_verified = true and override_reason is null)
    or
    (photo_verified = false and override_reason is not null
     and length(trim(override_reason)) > 0)
  )
);

create index attendance_org_event_idx
  on attendance_records (organization_id, event_id);
create index attendance_org_member_idx
  on attendance_records (organization_id, member_id);
create index attendance_org_time_idx
  on attendance_records (organization_id, checked_in_at);

-- ---------- AUDIT LOGS ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role actor_role not null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_org_time_idx on audit_logs (organization_id, created_at desc);
create index audit_actor_time_idx on audit_logs (actor_user_id, created_at desc);

-- ---------- ORGANIZATION SETTINGS ----------
create table organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (organization_id, setting_key)
);

-- ---------- CONTRACT EVENTS ----------
create table contract_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type text not null check (event_type in (
    'started','renewed','expired','photos_deleted',
    'qr_credentials_deleted','csv_exported','csv_export_failed',
    'archived_data_deleted','reactivated','archived_data_linked'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index contract_events_org_time_idx
  on contract_events (organization_id, created_at desc);

-- ---------- UPDATED_AT TRIGGER ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

create trigger memberships_set_updated_at
  before update on organization_memberships
  for each row execute function set_updated_at();

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();