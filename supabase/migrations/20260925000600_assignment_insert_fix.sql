-- Correctif d'affectation de mission — 2026-09-26.
--
-- POURQUOI CE CORRECTIF EST NÉCESSAIRE
--
-- `missionsService.createAssignment()` (src/services/missions.service.ts)
-- appelle un INSERT sur `mission_assignments`. Cet appel ne peut aboutir sur
-- aucune version du schéma appliquée jusqu'ici, pour DEUX raisons
-- indépendantes :
--
--   1. Aucune politique RLS `for insert` n'existe sur cette table. La
--      migration 20260925000300 n'en définit que deux : une pour `select`
--      et une pour `update`. Sans politique d'insertion, la RLS refuse
--      toute ligne insérée, même par un utilisateur légitime.
--
--   2. Le bloc de grants de 20260925000300 n'accorde sur cette table qu'un
--      `grant update (...)`. Aucun `grant insert` n'est accordé, et le
--      `revoke all` posé quelques lignes plus haut l'a supprimé.
--
-- Conséquence : le parcours d'affectation de mission (choix d'un agent ou
-- d'une société pour une mission publiée) est structurellement impossible,
-- alors qu'il est au coeur du modèle métier et déjà codé côté client.
--
-- QUI PEUT CRÉER UNE AFFECTATION
--
-- L'affectation désigne soit un agent (`agent_id`), soit une société
-- (`company_id`). La contrainte `mission_assignments_target_check` impose
-- `num_nonnulls(agent_id, company_id) = 1` : exactement une des deux
-- colonnes, jamais les deux, jamais aucune.
--
-- Sont autorisés :
--   - le client propriétaire de la mission, à condition que la mission soit
--     publiée (une affectation sur un brouillon n'a pas de sens) ;
--   - l'administrateur.
--
-- Ne sont PAS autorisés :
--   - un agent ou une société qui s'auto-attribuerait une mission ;
--   - tout utilisateur sans lien avec la mission.
--
-- Cette auto-attribution est précisément ce que la matrice de transitions
-- protège ensuite : l'agent affecté doit passer par `accept_assignment`, et non
-- se déclarer lui-même affecté.
--
-- Le statut n'est pas accordé dans le grant d'insertion : il reste hors de
-- portée du client et n'est modifiable que par les fonctions de transition
-- de la migration 20260925000400.
--
-- Idempotent : la politique est supprimée avant d'être recréée, donc ce
-- fichier peut être rejoué sans créer de doublon.

begin;

-- ---------------------------------------------------------------------------
-- 1. Helper RLS
--
-- Pourquoi un helper plutôt qu'une sous-requête écrite directement dans la
-- politique ?
--
-- Une sous-requête `select ... from public.missions` écrite dans une politique
-- s'exécute avec les DROITS DU ROLE APPELANT, c'est-à-dire `authenticated`. Or
-- la politique de lecture sur `missions` est
-- `using (private.can_view_mission(id))`. Un client qui tente d'insérer une
-- affectation doit donc d'abord passer cette politique de lecture : le
-- résultat dépend alors de la récursivité entre politiques, et le refus peut
-- survenir pour une raison invisible dans cette politique-ci.
--
-- La migration 20260925000200 a été écrite précisément pour éviter ce
-- problème : toutes les vérifications d'accès sont regroupées dans des
-- fonctions `SECURITY DEFINER` du schéma `private`, qui s'exécutent avec les
-- droits du propriétaire et ne sont donc pas soumises à la RLS.
--
-- On suit donc la même convention, sans exception.
-- ---------------------------------------------------------------------------
create or replace function private.can_assign_mission(target_mission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.missions m
    where m.id = target_mission_id
      and m.client_id = (select auth.uid())
      and m.status = 'published'
  );
$$;

revoke all on function private.can_assign_mission(uuid) from public, anon;
grant execute on function private.can_assign_mission(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Politique d'insertion, absente de 20260925000300
-- ---------------------------------------------------------------------------
drop policy if exists "Mission owners can create assignments" on public.mission_assignments;
create policy "Mission owners can create assignments" on public.mission_assignments for insert
  with check (
    private.is_admin()
    or (
      private.can_assign_mission(mission_id)
      and num_nonnulls(agent_id, company_id) = 1
    )
  );

-- Droit d'insertion, absent du bloc de grants de 20260925000300.
grant insert (mission_id, agent_id, company_id, proposed_rate)
  on table public.mission_assignments to authenticated;

-- Le droit d'insertion doit être retiré à anon comme à public, au même titre
-- que les autres tables métier. Le `revoke all` de 00300 ne portait que sur
-- les tables, pas sur ce grant ajouté ici.
revoke insert on table public.mission_assignments from anon;

commit;