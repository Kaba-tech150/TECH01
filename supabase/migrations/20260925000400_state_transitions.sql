-- Transitions d'état de mission et d'affectation contrôlées côté serveur.
--
-- Contexte : la migration 20260925000300 n'accorde au client aucune écriture sur
-- `missions.status` ni sur `mission_assignments.status`. Les méthodes correspondantes
-- du service TypeScript (publishMission, cancelMission, acceptAssignment,
-- rejectAssignment) sont donc volontairement inopérantes tant que ces fonctions
-- n'existent pas.
--
-- Cette migration expose des fonctions SECURITY DEFINER dans le schéma private,
-- appelables uniquement via des wrappers `public` accordés à `authenticated`.
-- Le client ne peut ainsi jamais écrire un statut directement : il demande une
-- transition, et le serveur valide l'état courant, l'acteur et la transition.
--
-- Principes appliqués :
--   1. Idempotence : toutes les fonctions sont en `create or replace`.
--   2. Verrouillage de la ligne mission avant lecture du statut (anti-concurrence).
--   3. Matrice de transitions explicite : toute transition absente est refusée.
--   4. Contrôle de l'acteur : le client ne peut agir que sur ses propres objets.
--   5. Aucune information de fuite : les refus sont génériques côté client.

begin;

-- ---------------------------------------------------------------------------
-- 1. Fonction interne : transition de mission
-- ---------------------------------------------------------------------------
create or replace function private.transition_mission(
  target_mission_id uuid,
  next_status public.mission_status
)
returns public.mission_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_mission public.missions%rowtype;
  current_status public.mission_status;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  -- Verrouille la mission pour éviter deux transitions concurrentes.
  select * into current_mission
  from public.missions
  where id = target_mission_id
  for update;

  if not found then
    raise exception 'Mission introuvable.' using errcode = 'P0002';
  end if;

  current_status := current_mission.status;

  -- Le client ne peut agir que sur ses propres missions.
  if current_mission.client_id <> (select auth.uid())
     and not private.is_admin() then
    raise exception 'Action non autorisée.' using errcode = '42501';
  end if;

  -- Matrice de transitions : published/accepted ne sont atteignables que par
  -- les fonctions dédiées (affectation), pas par le client.
  if not (
    (current_status = 'draft'     and next_status in ('published', 'cancelled')) or
    (current_status = 'published' and next_status in ('cancelled', 'disputed')) or
    (current_status = 'in_progress' and next_status in ('completed', 'disputed')) or
    (current_status = 'completed' and next_status in ('paid')) or
    (current_status = 'disputed'  and next_status in ('cancelled', 'completed'))
  ) then
    raise exception 'Transition de statut non autorisée.' using errcode = '23514';
  end if;

  update public.missions
  set status = next_status
  where id = target_mission_id;

  return next_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Fonction interne : transition d'affectation
-- ---------------------------------------------------------------------------
create or replace function private.transition_assignment(
  target_assignment_id uuid,
  next_status public.assignment_status
)
returns public.assignment_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_assignment public.mission_assignments%rowtype;
  mission_row public.missions%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select * into current_assignment
  from public.mission_assignments
  where id = target_assignment_id
  for update;

  if not found then
    raise exception 'Affectation introuvable.' using errcode = 'P0002';
  end if;

  -- Seul l'agent affecté (ou la société affectée) peut répondre.
  if not (
    exists (
      select 1 from public.agent_profiles ap
      where ap.id = current_assignment.agent_id
        and ap.profile_id = (select auth.uid())
    )
    or exists (
      select 1 from public.company_profiles cp
      where cp.id = current_assignment.company_id
        and cp.profile_id = (select auth.uid())
    )
    or private.is_admin()
  ) then
    raise exception 'Action non autorisée.' using errcode = '42501';
  end if;

  -- Matrice : une affectation en attente peut être acceptée ou refusée une fois.
  if not (
    (current_assignment.status = 'pending' and next_status in ('accepted', 'rejected'))
    or (current_assignment.status = 'accepted' and next_status in ('completed'))
  ) then
    raise exception 'Transition d''affectation non autorisée.' using errcode = '23514';
  end if;

  -- On ne peut accepter une affectation que sur une mission publiée.
  if next_status = 'accepted' then
    select * into mission_row from public.missions where id = current_assignment.mission_id;
    if mission_row.status <> 'published' then
      raise exception 'Mission non publiée.' using errcode = '23514';
    end if;
  end if;

  update public.mission_assignments
  set status = next_status
  where id = target_assignment_id;

  -- L'acceptation d'une affectation fait passer la mission en 'accepted'
  -- uniquement si elle était publiée.
  if next_status = 'accepted' and mission_row.status = 'published' then
    update public.missions
    set status = 'accepted'
    where id = current_assignment.mission_id
      and status = 'published';
  end if;

  return next_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Wrappers publics (seuls points d'entrée accessibles au client)
-- ---------------------------------------------------------------------------
create or replace function public.publish_mission(target_mission_id uuid)
returns public.mission_status
language sql
security definer
set search_path = ''
as $$ select private.transition_mission(target_mission_id, 'published'::public.mission_status); $$;

create or replace function public.cancel_mission(target_mission_id uuid)
returns public.mission_status
language sql
security definer
set search_path = ''
as $$ select private.transition_mission(target_mission_id, 'cancelled'::public.mission_status); $$;

create or replace function public.complete_mission(target_mission_id uuid)
returns public.mission_status
language sql
security definer
set search_path = ''
as $$ select private.transition_mission(target_mission_id, 'completed'::public.mission_status); $$;

create or replace function public.mark_mission_paid(target_mission_id uuid)
returns public.mission_status
language sql
security definer
set search_path = ''
as $$ select private.transition_mission(target_mission_id, 'paid'::public.mission_status); $$;

create or replace function public.open_mission_dispute(target_mission_id uuid)
returns public.mission_status
language sql
security definer
set search_path = ''
as $$ select private.transition_mission(target_mission_id, 'disputed'::public.mission_status); $$;

create or replace function public.accept_assignment(target_assignment_id uuid)
returns public.assignment_status
language sql
security definer
set search_path = ''
as $$ select private.transition_assignment(target_assignment_id, 'accepted'::public.assignment_status); $$;

create or replace function public.reject_assignment(target_assignment_id uuid)
returns public.assignment_status
language sql
security definer
set search_path = ''
as $$ select private.transition_assignment(target_assignment_id, 'rejected'::public.assignment_status); $$;

create or replace function public.complete_assignment(target_assignment_id uuid)
returns public.assignment_status
language sql
security definer
set search_path = ''
as $$ select private.transition_assignment(target_assignment_id, 'completed'::public.assignment_status); $$;

-- ---------------------------------------------------------------------------
-- 4. Droits d'exécution
-- ---------------------------------------------------------------------------
revoke all on function private.transition_mission(uuid, public.mission_status) from public, anon;
revoke all on function private.transition_assignment(uuid, public.assignment_status) from public, anon;

grant execute on function public.publish_mission(uuid) to authenticated;
grant execute on function public.cancel_mission(uuid) to authenticated;
grant execute on function public.complete_mission(uuid) to authenticated;
grant execute on function public.mark_mission_paid(uuid) to authenticated;
grant execute on function public.open_mission_dispute(uuid) to authenticated;
grant execute on function public.accept_assignment(uuid) to authenticated;
grant execute on function public.reject_assignment(uuid) to authenticated;
grant execute on function public.complete_assignment(uuid) to authenticated;

commit;

