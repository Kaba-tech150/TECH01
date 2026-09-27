-- =============================================================================
-- DIAGNOSTIC P1bis — POURQUOI L'INSERTION EST-ELLE ENCORE REFUSEE ?
-- =============================================================================
--
-- SITUATION
--
-- Le correctif `20260926001400` est bien applique : le controle 18 affiche
-- `auth.uid()` comme defaut de `missions.client_id`, et le controle 19 confirme
-- que le client n'a plus le droit d'ecrire cette colonne. L'application
-- n'envoie donc plus `client_id`.
--
-- Et pourtant, la creation d'une mission echoue TOUJOURS avec une violation RLS
-- (« Cette action n'a pas pu aboutir : vos droits ne permettent pas cette
-- operation »).
--
-- CE QUE CE FICHIER ETABLIT
--
-- Il rejoue l'insertion EXACTE de l'application — les memes colonnes, dans le
-- meme role, avec la meme origine de donnee — et affiche au prealable tout ce
-- qui peut la faire echouer : la politique, les triggers, les valeurs par
-- defaut.
--
-- Le `ROLLBACK` final annule tout : AUCUNE donnee n'est conservee, meme si
-- l'insertion reussit.
--
-- UTILISATION
--   SQL Editor > + New query > coller ce fichier ENTIER > Run
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PARTIE 1 — LE CONTEXTE (lecture seule)
--
-- Quatre requetes qui lisent le catalogue. Elles ne dependent d'aucune session
-- et ne peuvent pas echouer.
-- -----------------------------------------------------------------------------

-- 1a. La politique d'insertion, telle qu'elle existe reellement en base.
select
  'POLITIQUE INSERT' as source,
  policyname,
  permissive,
  roles::text,
  with_check
from pg_policies
where schemaname = 'public' and tablename = 'missions' and cmd = 'INSERT';

-- 1b. Les triggers de la table. Un BEFORE INSERT qui modifie une colonne
--     invaliderait la politique sans qu'on le voie.
select
  'TRIGGER' as source,
  tgname,
  pg_get_triggerdef(oid) as definition
from pg_trigger
where not tgisinternal
  and tgrelid = 'public.missions'::regclass;

-- 1c. Les valeurs par defaut et la nullabilite des colonnes qui participent a
--     la politique, plus celles que l'application envoie.
select
  'COLONNE' as source,
  column_name,
  is_nullable,
  column_default,
  udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'missions'
  and column_name in ('client_id', 'status', 'agent_count', 'city',
                      'title', 'address', 'start_time', 'end_time')
order by column_name;

-- 1d. L'integrite referentielle : `client_id` doit pointer un profil existant,
--     sinon l'insertion echoue sur la cle etrangere, pas sur la RLS.
--
--     On liste TOUTES les cles etrangeres de la table plutot que de filtrer sur
--     `client_id` : un filtre sur un tableau d'attributs est fragile, et une
--     requete de diagnostic qui echoue elle-meme ne vaut plus rien.
select
  'FK' as source,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.missions'::regclass
  and contype = 'f'
order by conname;


-- -----------------------------------------------------------------------------
-- PARTIE 2 — LA REPRODUCTION
--
-- Exactement ce que fait l'application, dans le meme role, avec la meme
-- origine. Si cette insertion REUSSIT, la base n'a aucun defaut et le
-- probleme est dans ce que l'application envoie reellement. Si elle ECHOUE,
-- le message d'erreur nomme la cause exacte.
-- -----------------------------------------------------------------------------

begin;

-- ⚠️ UTILISATION
--
-- Par défaut, la reproduction utilise le profil le plus RÉCENT, ce qui est le
-- bon compte si vous n'avez créé qu'un seul compte.
--
-- Si vous avez plusieurs comptes et voulez être sûr, exécutez d'abord :
--
--   select id, email from public.profiles order by created_at desc limit 5;
--
-- puis ajoutez `where id = '<UUID>'::uuid` dans la requête ci-dessous, avant le
-- `order by`.
-- On installe un jeton factice avant de basculer le role : la sous-requete est
-- donc evaluee en `postgres`, et le role bascule ensuite.
--
-- `is_local = false` : la variable survit au changement de role. Avec `true`,
-- le `SET LOCAL` suivant l'annulerait.
select set_config(
  'request.jwt.claims',
  (
    select json_build_object(
      'sub', id::text,
      'role', 'authenticated'
    )::text
    from public.profiles
    order by created_at desc
    limit 1
  ),
  false
);

-- Le rôle réel de l'application. C'est lui qui applique la politique.
set local role authenticated;

-- Ce que la base voit réellement. Si `uid_reel` est vide, le jeton n'a pas été
-- transmis : la politique compare alors `client_id` à NULL, et refuse. C'est
-- une cause fréquente, invisible depuis l'interface.
select
  'IDENTITE' as source,
  auth.uid() as uid_reel,
  current_user as role_reel,
  session_user as session_reel,
  current_setting('request.jwt.claims', true) as claims;

-- L'insertion. Colonnes identiques à celles envoyées par `useMissions.ts` :
-- ni `client_id`, ni `status`. Les deux doivent venir de leur valeur par défaut.
insert into public.missions
  (title, address, city, start_time, end_time, agent_count)
values
  ('diag', 'diag', 'Paris', now(), now() + interval '1 hour', 1);

-- Aucune donnée n'est conservée.
rollback;
