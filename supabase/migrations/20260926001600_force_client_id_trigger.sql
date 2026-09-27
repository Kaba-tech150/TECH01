-- ============================================================================
-- `missions.client_id` : abandon du DEFAULT, identité imposée par trigger
-- — 2026-09-27.
-- ============================================================================
--
-- CETTE MIGRATION INVERSE LA MIGRATION `20260926001400`.
--
-- POURQUOI
--
-- `01400` avait posé :
--
--     alter table public.missions
--       alter column client_id set default auth.uid();
--     revoke insert (client_id) on table public.missions from authenticated;
--
-- L'idée était bonne : faire écrire l'identité par le serveur plutôt que par
-- le client. Le test a échoué, et le diagnostic a nommé la cause.
--
-- LA CAUSE, ÉTABLIE PAR EXÉCUTION
--
-- Deux insertions, même rôle, même jeton, seules les colonnes diffèrent :
--
--   | TEST 2 (avant 01400)    | client_id ENVOYÉ | INSERT 0 1 (réussi) |
--   | DIAGNOSTIC (après 01400)| client_id OMIS    | 42501      (refusé) |
--
-- Un `DEFAULT` n'est PAS de la donnée : c'est une expression évaluée par
-- PostgreSQL quand il prépare l'instruction. Or `auth.uid()` lit la variable de
-- session `request.jwt.claims`.
--
--   - Dans le SQL Editor, le jeton est dans la session : `auth.uid()` répond.
--   - Via PostgREST, l'instruction est préparée dans le contexte du rôle
--     *preparer* de la requête, AVANT que le jeton de celle-ci ne soit
--     installé. `auth.uid()` renvoie alors `NULL`.
--
-- Résultat : `client_id` valait `NULL`, la clause `client_id = auth.uid()`
-- s'évaluait à `NULL` — donc fausse — et la politique refusait la ligne, avec
-- un message qui ne nommait aucune de ces deux raisons.
--
-- C'est la même classe de défaut que le faux `401` du début du projet : un
-- `DEFAULT` déplace la valeur hors du contexte applicatif, et une valeur
-- calculée hors de son contexte n'est plus la bonne.
--
-- `01400` a donc déplacé le problème sans le résoudre, et l'a rendu
-- DÉPENDANT DU MOMENT D'ÉVALUATION — plus fragile que la valeur explicite
-- qu'il voulait supprimer.
--
-- LE CORRECTIF : LE TRIGGER, PAS LE DEFAULT
--
-- On revient à l'envoi explicite de `client_id`, et on retire au client le
-- pouvoir de choisir sa valeur :
--
--   1. le droit `insert (client_id)` est réaccordé — sinon l'envoi échoue ;
--   2. un trigger `BEFORE INSERT` en `SECURITY DEFINER` RÉÉCRIT
--      `new.client_id = auth.uid()`.
--
-- Le déclencheur s'exécute pendant l'EXÉCUTION, donc dans le contexte du rôle
-- appelant, où le jeton EST installé. C'est le moment où `auth.uid()` répond.
--
-- CE QUE CELA GARANTIT
--
--   1. Le client ne peut PAS créer une mission au nom d'autrui. Il peut
--      envoyer n'importe quel `client_id` : le trigger l'écrase. La garantie ne
--      repose plus sur une comparaison dans une politique, ni sur l'absence
--      d'un droit, mais sur une ÉCRITURE INCONDITIONNELLE.
--   2. Un trigger en `SECURITY DEFINER` s'exécute même si l'appelant n'a pas
--      le droit d'écrire la colonne : c'est ce qui permet de réaccorder
--      `insert (client_id)` tout en gardant la valeur hors de portée du client.
--   3. `missions.status` n'est pas touché : la politique reste inchangée et
--      demeure le filet de sécurité.
--
-- L'IDENTITÉ EST TOUJOURS ÉCRITE PAR LE SERVEUR, AU BON MOMENT.
-- On a perdu le confort du `DEFAULT`, et gagné la certitude.
--
-- COMPATIBILITÉ — aucune donnée n'est modifiée : `client_id` reste `not null`,
-- et le trigger ne s'applique qu'aux insertions.
--
-- IDEMPOTENT : rejouable sans effet de bord.
--
-- ⚠️ NE PAS REJOUER `20260926001400` APRÈS CE FICHIER. Il repose le `DEFAULT`
-- et reprend le `REVOKE`, et l'insertion échouerait de nouveau.

begin;

-- ---------------------------------------------------------------------------
-- 1. Retirer le DEFAULT
--
--    La colonne redevient obligatoire sans valeur implicite, et le trigger
--    reprend le relais.
-- ---------------------------------------------------------------------------
alter table public.missions
  alter column client_id drop default;

-- ---------------------------------------------------------------------------
-- 2. Trigger : l'identité vient du jeton, quoi qu'ait envoyé le client
--
--    `security definer` est INDISPENSABLE : sans lui, le trigger s'exécute avec
--    les droits de l'appelant, et l'écriture de `client_id` échouerait puisque
--    l'appelant n'a — volontairement — aucun droit sur cette colonne.
--
--    `search_path = ''` est la convention du projet : la fonction ne doit pas
--    résoudre `auth` par un chemin que l'appelant pourrait détourner.
--
--    La fonction est `plpgsql` et non `sql` parce qu'elle AFFECTE une variable
--    d'enregistrement (`new`). C'est le seul endroit du projet où c'est
--    justifié : un trigger doit écrire dans `new`, ce qu'aucune fonction `sql`
--    ne peut faire.
-- ---------------------------------------------------------------------------
create or replace function private.force_mission_client_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Le jeton est la seule source de vérité. S'il est absent — appel serveur,
  -- script de maintenance — on refuse l'insertion plutôt que d'écrire `NULL`,
  -- qui violerait `not null` avec un message trompeur.
  if (select auth.uid()) is null then
    raise exception
      'SecuGuard : insertion refusee, aucun jeton dans le contexte';
  end if;

  new.client_id := (select auth.uid());
  return new;
end;
$$;

revoke all on function private.force_mission_client_id() from public, anon;

drop trigger if exists trg_force_mission_client_id on public.missions;
create trigger trg_force_mission_client_id
  before insert on public.missions
  for each row
  execute function private.force_mission_client_id();

-- ---------------------------------------------------------------------------
-- 3. Rétablir le droit d'écriture sur `client_id`
--
--    Nécessaire : l'application renvoie la colonne, et PostgreSQL refuse
--    d'insérer une colonne pour laquelle l'appelant n'a aucun droit — même
--    quand un trigger va la réécrire. Le droit est donc réaccorde, mais la
--    VALEUR n'est plus sous le contrôle du client : le trigger l'impose.
--
--    C'est le compromis assumé : un droit nécessaire à l'écriture, un résultat
--    que le client ne peut pas influencer.
-- ---------------------------------------------------------------------------
grant insert (client_id) on table public.missions to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Auto-vérification
--
--    Un trigger absent ne bloque rien : l'insertion échouerait simplement sur
--    la politique, comme avant. On vérifie donc les TROIS conditions du
--    correctif, pas seulement la présence du trigger.
-- ---------------------------------------------------------------------------
do $$
declare
  declencheur text;
begin
  select t.tgname
    into declencheur
    from pg_trigger t
   where t.tgrelid = 'public.missions'::regclass
     and not t.tgisinternal
     and t.tgenabled = 'O'
     and t.tgname = 'trg_force_mission_client_id';

  if declencheur is null then
    raise exception
      'ECHEC force_mission_client_id : le trigger BEFORE INSERT est absent ou desactive sur public.missions';
  end if;

  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'missions'
       and column_name = 'client_id'
       and column_default is not null
  ) then
    raise exception
      'ECHEC force_mission_client_id : missions.client_id a encore un DEFAULT ; la migration 01400 a-t-elle ete rejouee apres celle-ci ?';
  end if;

  if not exists (
    select 1
      from information_schema.column_privileges
     where table_schema = 'public'
       and table_name = 'missions'
       and column_name = 'client_id'
       and grantee = 'authenticated'
       and privilege_type = 'INSERT'
  ) then
    raise exception
      'ECHEC force_mission_client_id : le droit INSERT sur client_id n a pas ete reaccorde a authenticated';
  end if;
end;
$$;

commit;
