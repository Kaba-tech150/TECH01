-- ============================================================================
-- Clôturer la mission ET ses affectations, d'un seul geste — 2026-09-28
-- ============================================================================
--
-- LE SYMPTÔME
--
-- Le client clôture sa mission : le badge passe à « Terminée ». L'agent, de
-- son côté, voit toujours « Acceptée » sur son affectation. Deux écrans, deux
-- données, et une incohérence visible par les DEUX camps.
--
-- LA CAUSE : DEUX TRANSITIONS, DEUX ACTEURS DIFFÉRENTS
--
--   mission     `in_progress` → `completed` : le CLIENT       (transition_mission)
--   affectation `accepted`    → `completed` : l'AGENT AFFECTÉ (transition_assignment)
--
-- `transition_assignment` refuse toute autre acteur : un client ne peut pas
-- compléter sa propre affectation. Et `complete_assignment` n'a jamais été
-- appelée — elle existe, ses droits sont accordés, et personne ne l'a jamais
-- demandée. Une fonction inutilisée est parfaitement conforme, et aucun
-- contrôle ne le voyait.
--
-- Il n'existe donc AUCUN geste qui fasse avancer les deux ensemble. C'est le
-- neuvième défaut de la série, et le même que les huit autres : deux objets
-- qui doivent dire la même chose, sans qu'une action unique les mette d'accord.
--
--
-- CE QUE FAIT `cloturer_mission`
--
-- UNE transition de mission, qui emporte les affectations dans la MÊME
-- opération. Le client garde la main — c'est lui qui décide que la prestation
-- est terminée — et l'agent n'a plus rien à confirmer.
--
--
-- ⚠️ LA RÈGLE IMPOSÉE PAR LA BASE, ET ELLE EST ESSENTIELLE
--
-- Toute affectation encore `accepted` doit avoir pointé son DÉPART. Sans ce
-- contrôle, un client pourrait clore sa mission et forcer une affectation à
-- `completed` alors que l'agent n'est jamais venu — et l'agent perdrait le
-- droit de contester, puisque son affectation serait close.
--
-- Ce contrôle est ici, pas dans l'écran. Un écran qui le fait suffirait
-- jusqu'au premier client qui parle au serveur autrement.
--
--
-- IDEMPOTENCE
--
-- `create or replace` : rejouable sans effet de bord. Retraits APRÈS la
-- création — un `REVOKE` sur une fonction inexistante échoue en `42883`.
--
-- ⚠️ NE PAS REJOUER `20260928002200` APRÈS CE FICHIER.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Fonction interne
-- ---------------------------------------------------------------------------
create or replace function private.cloturer_mission(target_mission_id uuid)
returns public.mission_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_mission public.missions%rowtype;
  en_attente integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select * into current_mission
  from public.missions
  where id = target_mission_id
  for update;

  if not found then
    raise exception 'Mission introuvable.' using errcode = 'P0002';
  end if;

  -- Le client ne peut agir que sur ses propres missions.
  if current_mission.client_id <> (select auth.uid())
     and not private.is_admin() then
    raise exception 'Action non autorisée.' using errcode = '42501';
  end if;

  if current_mission.status <> 'in_progress' then
    raise exception 'Mission non clôturable.' using errcode = '23514';
  end if;

  -- TOUTES LES AFFECTATIONS EN COURS DOIVENT AVOIR ÉTÉ CLÔTURÉES PAR LEUR
  -- PRESTATAIRE. C'est la garantie que l'agent a fini sa vacation, et elle
  -- appartient à la base.
  select count(*) into en_attente
  from public.mission_assignments
  where mission_id = target_mission_id
    and status = 'accepted'
    and check_out_time is null;

  if en_attente > 0 then
    raise exception
      'Un prestataire n''a pas encore pointé son départ.'
      using errcode = '23514';
  end if;

  update public.mission_assignments
  set status = 'completed',
      updated_at = now()
  where mission_id = target_mission_id
    and status = 'accepted';

  update public.missions
  set status = 'completed',
      updated_at = now()
  where id = target_mission_id;

  return 'completed'::public.mission_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Point d'entrée public
--
--    `volatile`, ET C'EST ESSENTIEL : la fonction écrit. Une déclaration
--    `stable` — reprise par erreur le 2026-09-28 sur `pointer_arrivee` — fait
--    passer la transaction en lecture seule, et l'appel échoue en 405 sans que
--    le message parle de la volatilité.
-- ---------------------------------------------------------------------------
create or replace function public.cloturer_mission(target_mission_id uuid)
returns public.mission_status
language sql
volatile
security definer
set search_path = ''
as $$ select private.cloturer_mission(target_mission_id); $$;

revoke all on function private.cloturer_mission(uuid) from public;
revoke all on function private.cloturer_mission(uuid) from anon;
grant execute on function private.cloturer_mission(uuid) to authenticated;

revoke all on function public.cloturer_mission(uuid) from public;
revoke all on function public.cloturer_mission(uuid) from anon;
grant execute on function public.cloturer_mission(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Auto-vérification
--
--    On vérifie la VOLATILITÉ, pas seulement l'existence : c'est exactement ce
--    qui manquait au contrôle 25 avant l'incident du 2026-09-28.
-- ---------------------------------------------------------------------------
do $$
declare
  en_public boolean;
  est_volatile boolean;
begin
  select count(*) = 1 into en_public
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'cloturer_mission';

  select p.provolatile = 'v' into est_volatile
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'cloturer_mission';

  if en_public is not true then
    raise exception
      'ECHEC cloturer_mission : la fonction publique est absente';
  end if;

  if est_volatile is not true then
    raise exception
      'ECHEC cloturer_mission : la fonction n est pas volatile';
  end if;

  if not has_function_privilege('authenticated', 'public.cloturer_mission(uuid)', 'EXECUTE') then
    raise exception
      'ECHEC cloturer_mission : le role authenticated ne peut pas clore une mission';
  end if;
end;
$$;

commit;

