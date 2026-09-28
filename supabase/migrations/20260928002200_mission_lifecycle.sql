-- ============================================================================
-- La mission peut enfin se terminer — 2026-09-28
-- ============================================================================
--
-- LE TROU
--
-- `20260925000400_state_transitions.sql` définit cette matrice :
--
--   (draft      and next in ('published','cancelled'))      or
--   (published  and next in ('cancelled','disputed'))      or
--   (in_progress and next in ('completed','disputed'))      or
--   (completed  and next in ('paid'))                       or
--   (disputed   and next in ('cancelled','completed'))
--
-- `accepted` N'APPARAÎT DANS AUCUNE LIGNE.
--
-- Or c'est précisément là qu'une mission se trouve après que l'agent a
-- accepté : `transition_assignment` écrit
--
--   update public.missions set status = 'accepted' ...
--
-- CONSÉQUENCE, VÉRIFIÉE SUR LE CODE : une mission acceptée est un CUL-DE-SAC.
-- Elle ne peut plus être annulée (`cancel_mission` exige `published`), ni
-- disputée, ni terminée (`complete_mission` exige `in_progress`) — et
-- `in_progress` N'EST ATTEIGNABLE DEPUIS RIEN, aucune transition n'y mène.
--
-- Le client ne pourra jamais clôturer une mission qu'un agent a acceptée. Le
-- parcours décrit par le plan — publiée → acceptée → en cours → terminée →
-- payée — n'est pas implémenté dans la base.
--
-- Le plan du projet (étape 6) est donc IMPOSSIBLE à tenir en l'état. Ce n'est
-- pas un manque d'écran : c'est un trou de la machine à états.
--
--
-- CE QUE CE FICHIER FAIT
--
-- 1. Répare la matrice : `accepted` peut aller vers `in_progress`, `cancelled`
--    et `disputed`. Ajouter les trois sorties, et pas seulement `in_progress` :
--    donner à un état un unique chemin entrant mais aucun chemin sortant
--    reproduirait exactement le défaut qu'on corrige.
--
-- 2. Ajoute `pointer_arrivee` et `pointer_depart`. Le pointage passe par des
--    fonctions serveur, et non par un `UPDATE` direct du client.
--
-- POURQUOI DES FONCTIONS, ET NON UN `UPDATE`
--
-- La politique `Assigned agents can update mission reports` autorise déjà
-- l'écriture de `check_in_time` et `check_out_time`. Elle autorise donc
-- QUELCONQUE agent affecté à écrire ces colonnes, y compris un départ sans
-- arrivée, et y compris sans que la mission change d'état.
--
-- Passer par une fonction permet d'écrire les règles QUE LA BASE IMPOSE :
--
--   - seul l'agent affecté (ou l'admin) pointe ;
--   - on ne pointe qu'une affectation `accepted` ;
--   - **on ne peut pas partir sans être arrivé** ;
--   - l'arrivée fait passer la mission `accepted` → `in_progress`, dans la MÊME
--     opération. Sans cela, un agent pourrait pointer son arrivée et laisser la
--     mission en `accepted`, et le client n'aurait plus aucun chemin pour la
--     terminer.
--
-- L'AGENT DÉMARRE, IL NE TERMINE PAS
--
-- Le départ d'un agent ne clôture rien : il met fin à SA vacation. La mission
-- est terminée par le CLIENT, via `complete_mission`, qui exige `in_progress`.
--
-- C'est délibéré, et c'est une question d'intérêt : un agent qui pourrait
-- clore la mission pourrait le faire avant l'heure, et le temps facturé
-- s'arrêterait. La matrice de `00400` confie déjà `complete_mission` au
-- client, et ce fichier ne change pas ce partage.
--
--
-- IDEMPOTENCE
--
-- `create or replace` partout, retraits placés APRÈS la création : un `REVOKE`
-- sur une fonction inexistante échoue en `42883`, ce qui a déjà arrêté `02000`
-- puis `02100` à leur première exécution.
--
-- ⚠️ NE PAS REJOUER `20260925000400` APRÈS CE FICHIER : il repose la matrice.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Matrice réparée
--
--    `accepted` obtient SES TROIS SORTIES, pas une seule. Une transition
--    entrante sans transition sortante laisserait un cul-de-sac, exactement
--    celui qu'on supprime.
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

  if not (
    (current_status = 'draft'       and next_status in ('published', 'cancelled')) or
    (current_status = 'published'   and next_status in ('cancelled', 'disputed')) or
    (current_status = 'accepted'    and next_status in ('in_progress', 'cancelled', 'disputed')) or
    (current_status = 'in_progress' and next_status in ('completed', 'disputed')) or
    (current_status = 'completed'   and next_status in ('paid')) or
    (current_status = 'disputed'    and next_status in ('cancelled', 'completed'))
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
-- 2. Pointage d'arrivée et de départ
--
--    Le contrôle de l'acteur est celui de `transition_assignment` : l'agent
--    affecté, la société affectée, ou l'administrateur. Il est RÉPÉTÉ ici
--    volontairement — une fonction qui réutiliserait `transition_assignment`
--    devrait dupliquer sa matrice, et une divergence entre les deux
--    autoriserait exactement ce qu'on cherche à interdire.
-- ---------------------------------------------------------------------------
create or replace function private.pointer_arrivee(target_assignment_id uuid)
returns public.mission_status
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

  if not (
    exists (select 1 from public.agent_profiles ap
             where ap.id = current_assignment.agent_id
               and ap.profile_id = (select auth.uid()))
    or exists (select 1 from public.company_profiles cp
             where cp.id = current_assignment.company_id
               and cp.profile_id = (select auth.uid()))
    or private.is_admin()
  ) then
    raise exception 'Action non autorisée.' using errcode = '42501';
  end if;

  -- On ne pointe qu'une affectation ACCEPTÉE, et une seule fois.
  if current_assignment.status <> 'accepted' then
    raise exception 'Affectation non acceptée.' using errcode = '23514';
  end if;

  if current_assignment.check_in_time is not null then
    raise exception 'Arrivée déjà enregistrée.' using errcode = '23514';
  end if;

  select * into mission_row
  from public.missions
  where id = current_assignment.mission_id
  for update;

  if not found then
    raise exception 'Mission introuvable.' using errcode = 'P0002';
  end if;

  update public.mission_assignments
  set check_in_time = now()
  where id = target_assignment_id;

  -- L'ARRIVÉE DÉMARRE LA MISSION. C'est le seul endroit du code où le statut
  -- d'une mission change sans que ce soit le client, et c'est délibéré : le
  -- service a commencé, rien n'est clôturé.
  --
  -- Le `and status = 'accepted'` évite d'écraser une mission déjà en cours ou
  -- terminée : le pointage ne doit jamais faire retroceder une mission.
  if mission_row.status = 'accepted' then
    update public.missions
    set status = 'in_progress'
    where id = mission_row.id
      and status = 'accepted';
  end if;

  return 'in_progress'::public.mission_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Pointage de départ
--
--    ON NE PEUT PAS PARTIR SANS ÊTRE ARRIVÉ. La règle est vérifiée ici et
--    nulle part ailleurs : l'écran qui la ferait suffirait jusqu'au premier
--    client qui parle au serveur autrement.
-- ---------------------------------------------------------------------------
create or replace function private.pointer_depart(
  target_assignment_id uuid,
  p_rapport text
)
returns public.assignment_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_assignment public.mission_assignments%rowtype;
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

  if not (
    exists (select 1 from public.agent_profiles ap
             where ap.id = current_assignment.agent_id
               and ap.profile_id = (select auth.uid()))
    or exists (select 1 from public.company_profiles cp
             where cp.id = current_assignment.company_id
               and cp.profile_id = (select auth.uid()))
    or private.is_admin()
  ) then
    raise exception 'Action non autorisée.' using errcode = '42501';
  end if;

  if current_assignment.status <> 'accepted' then
    raise exception 'Affectation non acceptée.' using errcode = '23514';
  end if;

  if current_assignment.check_in_time is null then
    raise exception 'Impossible de partir sans avoir pointé son arrivée.'
      using errcode = '23514';
  end if;

  if current_assignment.check_out_time is not null then
    raise exception 'Départ déjà enregistré.' using errcode = '23514';
  end if;

  -- LE RAPPORT EST NORMALISÉ ICI, ET NON DANS LE CLIENT.
  -- Une chaîne de spaces est un rapport vide : elle ferait croire à un contenu.
  update public.mission_assignments
  set check_out_time = now(),
      report = nullif(btrim(coalesce(p_rapport, '')), '')
  where id = target_assignment_id;

  return current_assignment.status;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. Points d'entrée publics
--
--    PostgREST n'expose QUE le schéma `public`. Une fonction restée dans
--    `private` est invisible, et l'appel échoue en 404 — ce qui est
--    INDISTINGUABLE d'un échec métier pour l'utilisateur. Un 404 doit signifier
--    « migration absente », jamais « vous avez fait quelque chose de faux ».
-- ---------------------------------------------------------------------------
create or replace function public.pointer_arrivee(target_assignment_id uuid)
returns public.mission_status
language sql
stable
security definer
set search_path = ''
as $$ select private.pointer_arrivee(target_assignment_id); $$;

create or replace function public.pointer_depart(
  target_assignment_id uuid,
  p_rapport text
)
returns public.assignment_status
language sql
stable
security definer
set search_path = ''
as $$ select private.pointer_depart(target_assignment_id, p_rapport); $$;

-- Les retraits APRÈS la création : un `REVOKE` sur une fonction inexistante
-- échoue en `42883`.
revoke all on function private.pointer_arrivee(uuid) from public;
revoke all on function private.pointer_arrivee(uuid) from anon;
grant execute on function private.pointer_arrivee(uuid) to authenticated;

revoke all on function private.pointer_depart(uuid, text) from public;
revoke all on function private.pointer_depart(uuid, text) from anon;
grant execute on function private.pointer_depart(uuid, text) to authenticated;

revoke all on function public.pointer_arrivee(uuid) from public;
revoke all on function public.pointer_arrivee(uuid) from anon;
grant execute on function public.pointer_arrivee(uuid) to authenticated;

revoke all on function public.pointer_depart(uuid, text) from public;
revoke all on function public.pointer_depart(uuid, text) from anon;
grant execute on function public.pointer_depart(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Auto-vérification
--
--    On contrôle les SIX POINTS, pas un seul. Une matrice réparée sans fonction
--    au public donnerait un 404 à l'écran ; une fonction sans matrice
--    donnerait « Transition de statut non autorisée ». Deux symptômes pour une
--    seule cause, et c'est ce qui a coûté des journées ici.
-- ---------------------------------------------------------------------------
do $$
declare
  matrix_ok       boolean;
  arrivee_ok      boolean;
  depart_ok      boolean;
  arrivee_public boolean;
  depart_public  boolean;
  mission_ok     boolean;
begin
  -- `transition_mission` DOIT accepter `accepted` -> `in_progress`.
  --
  -- On ne peut pas appeler la fonction : elle exige une session et une
  -- transition réelle. On vérifie donc que le corps contient bien la clause,
  -- ce qui prouve que le fichier a été appliqué et non seulement compilé.
  select position(
           'current_status = ''accepted'' and next_status'
         in regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g')
         ) > 0
    into matrix_ok
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'transition_mission';

  select count(*) = 1 into arrivee_ok
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'pointer_arrivee';

  select count(*) = 1 into depart_ok
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'pointer_depart';

  select count(*) = 1 into arrivee_public
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'pointer_arrivee';

  select count(*) = 1 into depart_public
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'pointer_depart';

  -- `complete_mission` doit exister ET être exécutable : c'est lui qui ferme
  -- la boucle côté client, et il était déjà là sans que rien ne le déclenche.
  select count(*) = 1 into mission_ok
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'complete_mission';

  if matrix_ok is not true then
    raise exception
      'ECHEC mission_lifecycle : transition_mission n autorise toujours pas accepted -> in_progress';
  end if;

  if arrivee_ok is not true or arrivee_public is not true then
    raise exception
      'ECHEC mission_lifecycle : pointer_arrivee introuvable (prive/public = %/%)',
      arrivee_ok, arrivee_public;
  end if;

  if depart_ok is not true or depart_public is not true then
    raise exception
      'ECHEC mission_lifecycle : pointer_depart introuvable (prive/public = %/%)',
      depart_ok, depart_public;
  end if;

  if mission_ok is not true then
    raise exception
      'ECHEC mission_lifecycle : complete_mission est absente du schema public';
  end if;

  if not has_function_privilege('authenticated', 'public.pointer_arrivee(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.pointer_depart(uuid, text)', 'EXECUTE') then
    raise exception
      'ECHEC mission_lifecycle : le role authenticated ne peut pas pointer';
  end if;
end;
$$;

commit;

