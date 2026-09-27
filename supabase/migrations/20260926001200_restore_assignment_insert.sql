-- Restauration de l'insertion des affectations de mission — 2026-09-26.
--
-- POURQUOI CE FICHIER EST NÉCESSAIRE
--
-- Le contrôle 12 de supabase/verification/VERIFICATION_RAPIDE.sql renvoie
-- ALERTE : il ne trouve aucune politique `insert` sur public.mission_assignments.
--
-- Ce n'est pas la migration 20260925000600 qui est fautive, elle est correcte.
-- C'est une conséquence de l'ordre réel d'exécution des fichiers sur la base.
--
-- FAITS CONSTATÉS
--
--   1. Le helper private.can_assign_mission EXISTE (contrôle 11 = OK). Il est
--      créé par 20260925000600, dans la MÊME transaction et dans le MÊME
--      fichier que la politique d'insertion. Le fichier a donc bien été exécuté.
--
--   2. La politique d'insertion, elle, a disparu.
--
--   3. La chaîne de migrations définit 37 politiques au total : 32 en 00300,
--      1 en 00600, 0 en 00700 — son `create policy` est dans un commentaire —
--      4 en 01100, et ce fichier qui remplace celle de 00600 au même nom.
--      La base en compte 37 (contrôle 4).
--
-- POURQUOI LA FONCTION A SURVÉCU ET LA POLITIQUE NON
--
-- Seul un `DROP TABLE ... CASCADE` produit cet écart. Le CASCADE supprime au
-- passage toutes les politiques de la table et tous les droits accordés au
-- niveau table. En revanche il n'atteint PAS private.can_assign_mission, car
-- le corps d'une fonction SQL n'est pas une dépendance suivie par PostgreSQL.
--
-- C'est exactement ce que fait supabase/migrations/000001_reset_all.sql :
--   execute format('drop table if exists public.%I cascade', ...);
--
-- Ce fichier a donc été exécuté après 20260925000600, et la politique n'a
-- jamais été recréée depuis : 20260925000900 et 20260925001000 ne contiennent
-- que des `alter table ... add column if not exists` et des clés étrangères.
--
-- C'est aussi pourquoi le défaut est resté invisible : la moitié survivante de
-- 00600 (la fonction) passait les contrôles, l'autre moitié (la politique) non.
--
-- CONSÉQUENCE
--
-- missionsService.createAssignment() (src/services/missions.service.ts) appelle
-- un INSERT sur mission_assignments. Ni la politique ni le droit n'existent :
-- le parcours d'affectation d'un agent ou d'une société à une mission publiée
-- est structurellement impossible.
--
-- IDEMPOTENCE
--
-- Rejouable sans effet de bord : fonction en `create or replace`, politique
-- supprimée avant d'être recréée, droits réaccordés à l'identique.
--
-- ⚠️ NE PAS REJOUER 000001_reset_all.sql APRÈS CE FICHIER. La table serait à
-- nouveau supprimée et la politique disparaîtrait avec elle. Tout fichier
-- destructeur doit passer AVANT les migrations, jamais après.
--
-- VÉRIFICATION
--
-- Après exécution, relancer supabase/verification/VERIFICATION_RAPIDE.sql :
-- le contrôle 12 doit passer de ALERTE à OK, et le contrôle 4 doit annoncer
-- 37 politiques. Ce fichier échoue lui-même si son effet est incomplet.

begin;


-- ---------------------------------------------------------------------------
-- 1. Helper RLS
--
--    Recréé par précaution : il a survécu au reset sur cette base, mais rien
--    ne garantit qu'il survivrait à un reset exécuté dans un autre ordre.
--    Convention du projet : toute vérification d'accès vit dans le schéma
--    `private` en SECURITY DEFINER, jamais en sous-requête dans la politique,
--    parce qu'une sous-requête s'exécute avec les droits du rôle appelant.
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
-- 2. Politique d'insertion des affectations
--
--    Autorisés : le propriétaire d'une mission PUBLIÉE, et l'administrateur.
--    La mission doit être publiée : une affectation sur un brouillon n'a pas de
--    sens, puisque le client n'affecte que ce qu'il a publié.
--
--    `num_nonnulls(agent_id, company_id) = 1` rejoue ici la contrainte
--    mission_assignments_target_check. Un agent ne peut donc pas s'auto-attribuer
--    une mission : il doit passer par accept_assignment (00400).
--
--    Le statut n'est délibérément pas accordé à l'insertion : il reste hors de
--    portée du client et n'est modifiable que par les fonctions de transition.
-- ---------------------------------------------------------------------------
drop policy if exists "Mission owners can create assignments"
  on public.mission_assignments;
create policy "Mission owners can create assignments"
  on public.mission_assignments for insert
  with check (
    private.is_admin()
    or (
      private.can_assign_mission(mission_id)
      and num_nonnulls(agent_id, company_id) = 1
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Droits au niveau table, également tombés avec la table
--
--    Colonnes restreintes à l'affectation : ni `id`, ni `status`, ni `report`,
--    ni les horodatages de pointage. Un client ne peut donc pas s'écrire
--    `accepted` tout seul, ni se déclarer pointé.
-- ---------------------------------------------------------------------------
grant insert (mission_id, agent_id, company_id, proposed_rate)
  on table public.mission_assignments to authenticated;
revoke insert on table public.mission_assignments from anon;

-- ---------------------------------------------------------------------------
-- 4. Auto-vérification
--
--    Leçon retenue du projet : le code ne peut pas prouver son propre schéma.
--    Cette migration échoue donc bruyamment si son effet est incomplet, plutôt
--    que de laisser un demi-correctif passer inaperçu, comme c'est arrivé ici.
--
--    On contrôle les trois commandes attendues sur la table, pas seulement
--    l'insertion : c'est un DROP ... CASCADE qui a produit le défaut, donc
--    vérifier l'insertion seule ne prouverait pas que les autres survivent.
-- ---------------------------------------------------------------------------
do $$
declare
  commandes text;
begin
  -- `polcmd` ne contient PAS les lettres du SQL. Les valeurs reelles de
  -- PostgreSQL sont :
  --     * = ALL     r = SELECT     a = INSERT     w = UPDATE     d = DELETE
  --
  -- INSERT vaut donc **'a'** (pour « append »), et NON 'i'. Une valeur 'i'
  -- n'existe pas : la chercher revient a trouver zero, toujours.
  --
  -- C'est exactement ce qui a fait echouer cette migration le 2026-09-27 alors
  -- que la politique venait d'etre creee correctement. Le message affichait
  -- « a,r,w » — c'est-a-dire bien les trois commandes attendues — et le test
  -- les jugeait nevertheless incorrectes parce qu'il attendait « i,r,w ».
  --
  -- Un test qui echoue sur un etat correct est pire qu'un test absent : il
  -- envoie vers un diagnostic qui n'existe pas.
  select string_agg(polcmd, ',' order by polcmd)
    into commandes
    from pg_policy
   where polrelid = 'public.mission_assignments'::regclass
     and polcmd in ('r', 'a', 'w');

  if commandes is distinct from 'a,r,w' then
    raise exception
      'ECHEC restore_assignment_insert : commandes RLS trouvees sur mission_assignments = %, attendu a,r,w',
      coalesce(commandes, 'aucune');
  end if;
end;
$$;

commit;
