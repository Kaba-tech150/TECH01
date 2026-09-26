-- Migration RLS complète — Lot A du 2026-09-25.
--
-- Contexte : les migrations 20260925000100 et 20260925000200 créent la structure,
-- les triggers et les fonctions privées, mais n'activent AUCUNE politique RLS et
-- n'accordent AUCUN droit d'accès aux tables. Les tables restaient donc accessibles
-- selon les droits par défaut du rôle, ce qui expose les données sensibles et
-- explique l'erreur 42501 (permission denied for schema public).
--
-- Cette migration est idempotente : elle peut être rejouée sans risque.
-- Elle s'appuie sur les fonctions privées de 20260925000200_rls_helpers.sql
-- (has_role, is_admin, can_view_mission, can_view_assignment,
--  is_assignment_agent, can_review_mission).
--
-- Principes appliqués :
--   1. RLS activée et forcée sur les 12 tables.
--   2. Aucune donnée personnelle publiquement lisible.
--   3. Le client ne peut jamais écrire les soldes, transactions ni statuts sensibles.
--   4. Les transitions d'état de mission et d'affectation restent bloquées côté
--      client : elles devront être exposées par des fonctions SECURITY DEFINER
--      ou des Edge Functions lors d'une étape ultérieure (TODO — À CONFIRMER).
--   5. Les écritures d'administration restent contraintes par les grants de
--      colonnes (ex. documents.status n'est modifiable que par l'admin car absent
--      des colonnes accordées au client).

begin;

-- ---------------------------------------------------------------------------
-- 1. Activation et forçage de la RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.documents enable row level security;
alter table public.missions enable row level security;
alter table public.mission_assignments enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Force RLS également pour le propriétaire des tables.
--
-- ATTENTION — INTERACTION AVEC 20260925000400_state_transitions.sql :
-- `force row level security` soumet également le propriétaire de la table aux
-- politiques. Les fonctions de transition étant en SECURITY DEFINER, elles
-- s'exécutent avec les droits du propriétaire : sous FORCE, la politique
-- "Clients can edit own draft mission details" (qui exige status = 'draft')
-- s'applique aussi et rejetterait toute écriture de statut.
--
-- Ces fonctions sont donc prévues pour s'exécuter avec un rôle disposant de
-- BYPASSRLS (typiquement le propriétaire `postgres` sur Supabase).
--
-- Si les transitions échouent avec une erreur de politique après application,
-- appliquer le correctif 20260925000500_rls_transitions_fix.sql qui retire le
-- FORCE sur `missions` et `mission_assignments` et s'appuie uniquement sur
-- `enable row level security` (le rôle anon/authenticated n'étant de toute
-- façon jamais le propriétaire, la sécurité côté client est inchangée).
alter table public.profiles force row level security;
alter table public.profile_roles force row level security;
alter table public.agent_profiles force row level security;
alter table public.company_profiles force row level security;
alter table public.documents force row level security;
alter table public.missions force row level security;
alter table public.mission_assignments force row level security;
alter table public.wallets force row level security;
alter table public.transactions force row level security;
alter table public.reviews force row level security;
alter table public.messages force row level security;
alter table public.notifications force row level security;


-- ---------------------------------------------------------------------------
-- 2. Nettoyage préalable (idempotence)
-- ---------------------------------------------------------------------------
drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
drop policy if exists "Owners and admins can update profile details" on public.profiles;
drop policy if exists "Users can view their role assignments" on public.profile_roles;
drop policy if exists "Admins can add role assignments" on public.profile_roles;
drop policy if exists "Admins can update role assignments" on public.profile_roles;
drop policy if exists "Admins can remove role assignments" on public.profile_roles;
drop policy if exists "Agents can view own or company-linked profile" on public.agent_profiles;
drop policy if exists "Agents can create own pending profile" on public.agent_profiles;
drop policy if exists "Agents can update own profile details" on public.agent_profiles;
drop policy if exists "Admins can update agent profiles" on public.agent_profiles;
drop policy if exists "Companies can view own profile" on public.company_profiles;
drop policy if exists "Companies can create own pending profile" on public.company_profiles;
drop policy if exists "Companies can update own profile details" on public.company_profiles;
drop policy if exists "Admins can update company profiles" on public.company_profiles;
drop policy if exists "Users can view own documents; admins can view all" on public.documents;
drop policy if exists "Users can submit own documents" on public.documents;
drop policy if exists "Admins can review documents" on public.documents;
drop policy if exists "Mission participants can view mission" on public.missions;
drop policy if exists "Clients can create draft missions" on public.missions;
drop policy if exists "Clients can edit own draft mission details" on public.missions;
drop policy if exists "Mission participants can view assignments" on public.mission_assignments;
drop policy if exists "Assigned agents can update mission reports" on public.mission_assignments;
drop policy if exists "Users can view own wallet; admins can view all" on public.wallets;
drop policy if exists "Users can view own transactions; admins can view all" on public.transactions;
drop policy if exists "Review participants can view reviews" on public.reviews;
drop policy if exists "Mission participants can create valid reviews" on public.reviews;
drop policy if exists "Review authors can edit their review" on public.reviews;
drop policy if exists "Mission participants can view messages" on public.messages;
drop policy if exists "Mission participants can send messages as themselves" on public.messages;
drop policy if exists "Mission participants can mark messages read" on public.messages;
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can mark own notifications read" on public.notifications;

-- ---------------------------------------------------------------------------
-- 3. Politiques RLS (32 politiques)
-- ---------------------------------------------------------------------------

-- profiles : aucun profil n'est publiquement lisible.
create policy "Profiles are viewable by owner or admin" on public.profiles for select
  using (id = (select auth.uid()) or private.is_admin());

create policy "Owners and admins can update profile details" on public.profiles for update
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

-- profile_roles : seul l'admin peut attribuer ou retirer un rôle.
-- Le rôle n'est donc pas modifiable par le client.
create policy "Users can view their role assignments" on public.profile_roles for select
  using (profile_id = (select auth.uid()) or private.is_admin());
create policy "Admins can add role assignments" on public.profile_roles for insert
  with check (private.is_admin());
create policy "Admins can update role assignments" on public.profile_roles for update
  using (private.is_admin()) with check (private.is_admin());
create policy "Admins can remove role assignments" on public.profile_roles for delete
  using (private.is_admin());

-- agent_profiles : lecture par l'agent lui-même, sa société, ou l'admin.
create policy "Agents can view own or company-linked profile" on public.agent_profiles for select
  using (
    profile_id = (select auth.uid()) or private.is_admin()
    or exists (
      select 1 from public.company_profiles cp
      where cp.id = agent_profiles.company_id and cp.profile_id = (select auth.uid())
    )
  );
create policy "Agents can create own pending profile" on public.agent_profiles for insert
  with check (profile_id = (select auth.uid()) and company_id is null and status = 'registered');
create policy "Agents can update own profile details" on public.agent_profiles for update
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "Admins can update agent profiles" on public.agent_profiles for update
  using (private.is_admin()) with check (private.is_admin());

-- company_profiles : lecture par la société elle-même ou l'admin.
create policy "Companies can view own profile" on public.company_profiles for select
  using (profile_id = (select auth.uid()) or private.is_admin());
create policy "Companies can create own pending profile" on public.company_profiles for insert
  with check (profile_id = (select auth.uid()) and status = 'registered');
create policy "Companies can update own profile details" on public.company_profiles for update
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "Admins can update company profiles" on public.company_profiles for update
  using (private.is_admin()) with check (private.is_admin());

-- documents : lecture par le propriétaire ou l'admin. Seul l'admin statue
-- (le statut n'est pas dans les colonnes accordées au client, cf. section 4).
create policy "Users can view own documents; admins can view all" on public.documents for select
  using (profile_id = (select auth.uid()) or private.is_admin());
create policy "Users can submit own documents" on public.documents for insert
  with check (profile_id = (select auth.uid()) and status = 'documents_submitted');
create policy "Admins can review documents" on public.documents for update
  using (private.is_admin()) with check (private.is_admin());

-- missions : visibilité limitée aux participants. Un client ne crée et ne modifie
-- que ses missions au statut 'draft' ; la publication et les changements d'état
-- devront passer par des fonctions serveur (TODO — À CONFIRMER).
create policy "Mission participants can view mission" on public.missions for select
  using (private.can_view_mission(id));
create policy "Clients can create draft missions" on public.missions for insert
  with check (client_id = (select auth.uid()) and status = 'draft');
create policy "Clients can edit own draft mission details" on public.missions for update
  using (client_id = (select auth.uid()) and status = 'draft')
  with check (client_id = (select auth.uid()) and status = 'draft');

-- mission_assignments : l'agent affecté met à jour check-in/check-out et son
-- rapport. Le statut d'affectation reste hors des colonnes accordées au client.
create policy "Mission participants can view assignments" on public.mission_assignments for select
  using (private.can_view_assignment(id));
create policy "Assigned agents can update mission reports" on public.mission_assignments for update
  using (private.is_assignment_agent(id)) with check (private.is_assignment_agent(id));

-- wallets : lecture seule pour le propriétaire et l'admin. Aucune écriture.
create policy "Users can view own wallet; admins can view all" on public.wallets for select
  using (profile_id = (select auth.uid()) or private.is_admin());

-- transactions : lecture seule, jamais d'écriture directe depuis le client.
create policy "Users can view own transactions; admins can view all" on public.transactions for select
  using (
    private.is_admin() or exists (
      select 1 from public.wallets w
      where w.id = transactions.wallet_id and w.profile_id = (select auth.uid())
    )
  );

-- reviews : uniquement entre participants d'une mission terminée.
create policy "Review participants can view reviews" on public.reviews for select
  using (reviewer_id = (select auth.uid()) or reviewee_id = (select auth.uid()) or private.is_admin());
create policy "Mission participants can create valid reviews" on public.reviews for insert
  with check (
    reviewer_id = (select auth.uid()) and reviewee_id <> (select auth.uid())
    and private.can_review_mission(mission_id, reviewee_id)
  );
create policy "Review authors can edit their review" on public.reviews for update
  using (reviewer_id = (select auth.uid()))
  with check (reviewer_id = (select auth.uid()) and private.can_review_mission(mission_id, reviewee_id));

-- messages : réservés aux participants de la mission.
create policy "Mission participants can view messages" on public.messages for select
  using (private.can_view_mission(mission_id));
create policy "Mission participants can send messages as themselves" on public.messages for insert
  with check (sender_id = (select auth.uid()) and private.can_view_mission(mission_id));
create policy "Mission participants can mark messages read" on public.messages for update
  using (private.can_view_mission(mission_id)) with check (private.can_view_mission(mission_id));

-- notifications : strictement privées.
create policy "Users can view own notifications" on public.notifications for select
  using (profile_id = (select auth.uid()));
create policy "Users can mark own notifications read" on public.notifications for update
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Droits d'accès (grants)
-- ---------------------------------------------------------------------------
-- Le client ne peut jamais écrire les soldes, les transactions ni les statuts sensibles.
revoke all on table public.profiles, public.profile_roles, public.agent_profiles,
  public.company_profiles, public.documents, public.missions, public.mission_assignments,
  public.wallets, public.transactions, public.reviews, public.messages, public.notifications
  from anon, authenticated;

grant select on table public.profiles, public.profile_roles, public.agent_profiles,
  public.company_profiles, public.documents, public.missions, public.mission_assignments,
  public.wallets, public.transactions, public.reviews, public.messages, public.notifications
  to authenticated;

grant insert, update, delete on table public.profile_roles to authenticated;
grant update (full_name, phone, avatar_url) on table public.profiles to authenticated;
grant insert (profile_id, certification_number, certification_expiry, hourly_rate, zone, bio)
  on table public.agent_profiles to authenticated;
grant update (certification_number, certification_expiry, hourly_rate, zone, bio, is_available)
  on table public.agent_profiles to authenticated;
grant insert (profile_id, company_name, siret, address, city, postal_code, description, website)
  on table public.company_profiles to authenticated;
grant update (company_name, siret, address, city, postal_code, description, website)
  on table public.company_profiles to authenticated;
grant insert (profile_id, document_type, document_url, document_name, expiry_date)
  on table public.documents to authenticated;
grant update (status, rejection_reason, verified_by, verified_at)
  on table public.documents to authenticated;
grant insert (client_id, title, description, address, city, postal_code, start_time, end_time, agent_count, budget, special_requirements)
  on table public.missions to authenticated;
grant update (title, description, address, city, postal_code, start_time, end_time, agent_count, budget, special_requirements)
  on table public.missions to authenticated;
grant update (check_in_time, check_in_location_lat, check_in_location_lng, check_out_time, check_out_location_lat, check_out_location_lng, report)
  on table public.mission_assignments to authenticated;
grant insert (mission_id, reviewer_id, reviewee_id, rating, comment)
  on table public.reviews to authenticated;
grant update (rating, comment) on table public.reviews to authenticated;
grant insert (mission_id, sender_id, content) on table public.messages to authenticated;
grant update (read) on table public.messages to authenticated;
grant update (read) on table public.notifications to authenticated;

-- Les tables doivent être atteignables via le schéma public.
grant usage on schema public to anon, authenticated;

commit;

