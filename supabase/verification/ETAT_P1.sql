-- =============================================================================
-- ÉTAT P1 — QU'EST-CE QUI EST RÉELLEMENT EN BASE ? (lecture seule)
-- =============================================================================
--
-- POURQUOI CE FICHIER
--
-- L'insertion échoue encore avec « new row violates row-level security
-- policy for table "missions" », et la LECTURE des missions renvoie 403.
--
-- Deux informations manquent, et aucune ne se devine :
--
--   1. Les migrations 01200 et 01600 ont-elles été appliquées ? Rien dans
--      l'application ne peut le dire : une migration absente et une migration
--      présente produisent la même erreur côté client.
--   2. Que vaut EXACTEMENT la politique d'insertion, et quelles sont les
--      valeurs par défaut réelles de `client_id` et `status` ?
--
-- CE FICHIER NE MODIFIE RIEN. Tout est en lecture seule : aucun INSERT, aucun
-- UPDATE, aucun ROLLBACK nécessaire. Il ne peut rien casser.
--
-- AUCUNE DONNÉE N'EST CRÉÉE, AUCUNE LIGNE N'EST MODIFIÉE.
--
-- UTILISATION
--   SQL Editor > + New query > coller ce fichier ENTIER > Run
-- =============================================================================


-- 1. La politique d'insertion, telle qu'elle existe. C'est la phrase que la
--    base refuse de satisfaire — il faut la lire mot à mot.
select
  '1. POLITIQUE INSERT' as bloc,
  policyname,
  permissive,
  roles::text as roles,
  with_check
from pg_policies
where schemaname = 'public' and tablename = 'missions' and cmd = 'INSERT';


-- 2. Le déclencheur de 01600 est-il là ? C'est lui qui doit écrire l'identité.
--    Si cette ligne est vide, la migration 01600 n'est pas appliquée.
select
  '2. TRIGGER client_id' as bloc,
  t.tgname,
  t.tgenabled,
  pg_get_triggerdef(t.oid) as definition
from pg_trigger t
where t.tgrelid = 'public.missions'::regclass
  and not t.tgisinternal
order by t.tgname;


-- 3. Les valeurs par défaut réelles. C'est LE point décisif.
--    - `client_id` ne doit PLUS avoir de DEFAULT (01600 le retire)
--    - `status` doit valoir 'draft'
select
  '3. DEFAUT' as bloc,
  column_name,
  is_nullable,
  coalesce(column_default, '<<< AUCUN DEFAULT >>>') as valeur_par_defaut
from information_schema.columns
where table_schema = 'public'
  and table_name = 'missions'
  and column_name in ('client_id', 'status')
order by column_name;


-- 4. Les droits d'écriture du rôle authentifié, colonne par colonne.
--    01600 doit avoir réaccordé INSERT sur client_id.
select
  '4. DROITS INSERT' as bloc,
  column_name,
  grantee,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'missions'
  and grantee = 'authenticated'
  and privilege_type = 'INSERT'
order by column_name;


-- 5. LE POINT LE PLUS UTILE : la lecture des missions renvoie 403.
--    Un 403 sur une lecture signifie « rôle authentifié sans droit de lecture »,
--    ce qui est ANORMAL : la liste des missions doit fonctionner.
--    On regarde donc ce que reçoit réellement la base.
select
  '5. DROITS LECTURE' as bloc,
  grantee,
  count(*)::text as nb_colonnes
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'missions'
  and grantee = 'authenticated'
  and privilege_type = 'SELECT'
group by grantee;


-- 6. La politique de lecture, et le helper qu'elle appelle.
--    Si le SELECT est refusé, c'est ici que ça se joue.
select
  '6. POLITIQUE SELECT' as bloc,
  policyname,
  permissive,
  roles::text as roles,
  using_expr
from pg_policies
where schemaname = 'public' and tablename = 'missions' and cmd = 'SELECT';


-- 7. Le helper de visibilité existe-t-il et est-il exécutable ?
--    Une politique qui appelle une fonction absente refuse TOUT, en lecture
--    comme en écriture, sans message explicite.
select
  '7. HELPER can_view_mission' as bloc,
  n.nspname as schema,
  p.proname,
  p.prosecdef as security_definer,
  p.provolatile as volatilite,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as executable_par_authenticated
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'can_view_mission';


-- 8. LesTrigger du profil : si l'inscription n'a pas créé le profil, la clé
--    étrangère de client_id refusera l'insertion, et le message serait différent.
--    On vérifie juste qu'il y a bien des profils.
select
  '8. PROFILS' as bloc,
  count(*)::text as nb_profils,
  count(*) filter (where role = 'client')::text as dont_clients
from public.profiles;
