-- Migration initiale SecuGuard : structure, contraintes et triggers.
begin;

create schema if not exists extensions;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

do $$ begin create type public.user_role as enum ('client', 'agent', 'company', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mission_status as enum ('draft', 'published', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed', 'paid'); exception when duplicate_object then null; end $$;
alter type public.mission_status add value if not exists 'paid';
do $$ begin create type public.provider_status as enum ('registered', 'documents_submitted', 'in_validation', 'validated', 'rejected', 'active', 'suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('blocked', 'released', 'refunded', 'in_dispute'); exception when duplicate_object then null; end $$;
do $$ begin create type public.assignment_status as enum ('pending', 'accepted', 'rejected', 'completed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.document_type as enum ('identity', 'certification', 'insurance', 'other'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.user_role not null default 'client',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, role)
);

create table if not exists public.company_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null check (char_length(trim(company_name)) > 0),
  siret text unique,
  address text,
  city text,
  postal_code text,
  description text,
  website text,
  status public.provider_status not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  company_id uuid references public.company_profiles(id) on delete set null,
  certification_number text,
  certification_expiry date,
  hourly_rate numeric(10,2) check (hourly_rate is null or hourly_rate >= 0),
  zone text,
  bio text,
  status public.provider_status not null default 'registered',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.document_type not null,
  document_url text not null,
  document_name text,
  expiry_date date,
  status public.provider_status not null default 'documents_submitted',
  rejection_reason text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default extensions.gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  address text not null check (char_length(trim(address)) > 0),
  city text not null check (char_length(trim(city)) > 0),
  postal_code text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  agent_count integer not null default 1 check (agent_count > 0),
  budget numeric(10,2) check (budget is null or budget >= 0),
  status public.mission_status not null default 'draft',
  special_requirements text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint missions_time_range_check check (end_time > start_time)
);

create table if not exists public.mission_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  agent_id uuid references public.agent_profiles(id) on delete set null,
  company_id uuid references public.company_profiles(id) on delete set null,
  status public.assignment_status not null default 'pending',
  proposed_rate numeric(10,2) check (proposed_rate is null or proposed_rate >= 0),
  check_in_time timestamptz,
  check_in_location_lat numeric(10,8) check (check_in_location_lat between -90 and 90),
  check_in_location_lng numeric(10,8) check (check_in_location_lng between -180 and 180),
  check_out_time timestamptz,
  check_out_location_lat numeric(10,8) check (check_out_location_lat between -90 and 90),
  check_out_location_lng numeric(10,8) check (check_out_location_lng between -180 and 180),
  report text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_assignments_target_check check (num_nonnulls(agent_id, company_id) = 1)
);

create unique index if not exists mission_assignments_agent_unique on public.mission_assignments(mission_id, agent_id) where agent_id is not null;
create unique index if not exists mission_assignments_company_unique on public.mission_assignments(mission_id, company_id) where company_id is not null;

create table if not exists public.wallets (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  blocked_balance numeric(12,2) not null default 0 check (blocked_balance >= 0),
  stripe_account_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  mission_id uuid references public.missions(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('credit', 'debit')),
  status public.payment_status not null default 'blocked',
  description text,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_reviewer_not_self check (reviewer_id <> reviewee_id),
  constraint reviews_unique_per_participant unique (mission_id, reviewer_id, reviewee_id)
);

create table if not exists public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profile_roles_role on public.profile_roles(role);
create index if not exists idx_agent_profiles_company_id on public.agent_profiles(company_id);
create index if not exists idx_agent_profiles_status on public.agent_profiles(status);
create index if not exists idx_agent_profiles_zone on public.agent_profiles(zone);
create index if not exists idx_company_profiles_status on public.company_profiles(status);
create index if not exists idx_documents_profile_id on public.documents(profile_id);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_missions_client_id on public.missions(client_id);
create index if not exists idx_missions_status on public.missions(status);
create index if not exists idx_missions_start_time on public.missions(start_time);
create index if not exists idx_missions_city on public.missions(city);
create index if not exists idx_mission_assignments_mission_id on public.mission_assignments(mission_id);
create index if not exists idx_mission_assignments_agent_id on public.mission_assignments(agent_id);
create index if not exists idx_mission_assignments_company_id on public.mission_assignments(company_id);
create index if not exists idx_mission_assignments_status on public.mission_assignments(status);
create index if not exists idx_transactions_mission_id on public.transactions(mission_id);
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_reviews_mission_id on public.reviews(mission_id);
create index if not exists idx_reviews_reviewer_id on public.reviews(reviewer_id);
create index if not exists idx_reviews_reviewee_id on public.reviews(reviewee_id);
create index if not exists idx_messages_mission_created on public.messages(mission_id, created_at);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_notifications_profile_unread on public.notifications(profile_id, created_at desc) where not read;


create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
drop trigger if exists set_agent_profiles_updated_at on public.agent_profiles;
create trigger set_agent_profiles_updated_at before update on public.agent_profiles for each row execute function private.set_updated_at();
drop trigger if exists set_company_profiles_updated_at on public.company_profiles;
create trigger set_company_profiles_updated_at before update on public.company_profiles for each row execute function private.set_updated_at();
drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at before update on public.documents for each row execute function private.set_updated_at();
drop trigger if exists set_missions_updated_at on public.missions;
create trigger set_missions_updated_at before update on public.missions for each row execute function private.set_updated_at();
drop trigger if exists set_mission_assignments_updated_at on public.mission_assignments;
create trigger set_mission_assignments_updated_at before update on public.mission_assignments for each row execute function private.set_updated_at();
drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at before update on public.wallets for each row execute function private.set_updated_at();
drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions for each row execute function private.set_updated_at();
drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.user_role;
begin
  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'client'));
  safe_role := case requested_role when 'agent' then 'agent'::public.user_role when 'company' then 'company'::public.user_role else 'client'::public.user_role end;
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name', safe_role)
  on conflict (id) do nothing;
  insert into public.profile_roles (profile_id, role) values (new.id, safe_role) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_secuguard on auth.users;
create trigger on_auth_user_created_secuguard after insert on auth.users for each row execute function private.handle_new_auth_user();

create or replace function private.create_wallet_for_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wallets (profile_id) values (new.id) on conflict (profile_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_wallet on public.profiles;
create trigger on_profile_created_wallet after insert on public.profiles for each row execute function private.create_wallet_for_profile();

revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_new_auth_user() from public;
revoke all on function private.create_wallet_for_profile() from public;

commit;

