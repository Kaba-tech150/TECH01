-- =============================================================================
-- P1 — PERMISSIVE ou RESTRICTIVE ? (un seul jeu de résultats)
-- =============================================================================
--
-- POURQUOI
--
-- Les neuf contrôles précédents sont TOUS au vert :
--   politique INSERT présente, politique SELECT présente, trigger 01600
--   installé, DEFAULT supprimé, droits accordés, RLS active, 1 profil client.
--
-- Pourtant l'insertion est refusée ET la lecture renvoie 403.
--
-- Une seule cause explique les DEUX à la fois : si les politiques sont
-- RESTRICTIVE au lieu de PERMISSIVE, elles ne GLISSENT PLUS le droit, elles
-- l'INTERDISENT. En PostgreSQL, avec RLS active, une politique restrictive
-- seule n'accorde rien : toute écriture est refusée et toute lecture renvoie
-- 403. C'est la seule configuration qui produise exactement les deux
-- symptômes observés en même temps.
--
-- Ce contrôle mesure le caractère PERMISSIVE / RESTRICTIVE de chaque politique
-- de `missions`, et de toutes les tables, pour vérifier qu'aucune n'a dérivé.
--
-- ATTENTION : ce contrôle manquait dans la version précédente. C'est une
-- omission de ma part, et elle porte précisément sur la seule hypothèse qui
-- expliquait encore les deux symptômes.
--
-- AUCUNE ÉCRITURE : ni INSERT, ni UPDATE, ni DELETE, ni DDL.
--
-- UTILISATION
--   SQL Editor > + New query > coller ce fichier ENTIER > Run
-- =============================================================================

with politiques(ordre, table_name, commande, politique, caractere) as (

  -- 1. Les politiques de `missions`, une par une. C'est LA table du problème.
  select
    1,
    c.relname,
    case p.polcmd
      when '*' then 'TOUTES'
      when 'r' then 'SELECT'
      when 'a' then 'INSERT'
      when 'w' then 'UPDATE'
      when 'd' then 'DELETE'
      else p.polcmd
    end,
    p.polname,
    case when p.polpermissive then 'PERMISSIVE' else 'RESTRICTIVE <<< PROBLEME' end
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'missions'

  -- 2. Bilan global : combien de RESTRICTIVE sur tout le schéma public ?
  --    Un seul suffit à fermer une table. On veut le voir nominalement.
  union all
  select
    2,
    '=== TOUT LE SCHEMA ===',
    'bilan',
    'politiques RESTRICTIVE : ' || count(*)::text,
    case when count(*) = 0 then 'OK : aucune' else 'A EXAMINER' end
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not p.polpermissive

  -- 3. Bilan global du nombre de politiques : la chaîne en définit 38.
  union all
  select
    3,
    '=== TOUT LE SCHEMA ===',
    'bilan',
    'politiques totales : ' || count(*)::text,
    case when count(*) >= 38 then 'OK' else 'INFERIEUR A 38' end
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'

  -- 4. Les tables dont RLS est active mais qui n'ont AUCUNE politique
  --    PERMISSIVE : elles sont automatiquement fermées, en lecture comme en
  --    écriture, sans que la politique soit visible dans la liste.
  union all
  select
    4,
    c.relname,
    'table fermee',
    'aucune politique PERMISSIVE',
    'VERIFIER <<< ' || c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
    and not exists (
      select 1 from pg_policy p
       where p.polrelid = c.oid and p.polpermissive
    )
)

select ordre as "#", table_name as "table", commande as "commande",
       politique as "politique", caractere as "permessivite"
from politiques
order by ordre, politique;
