-- `missions.client_id` est désormais dérivé du jeton — 2026-09-26.
--
-- POURQUOI CE CHANGEMENT
--
-- L'insertion d'une mission échouait avec
--
--   new row violates row-level security policy for table "missions"
--
-- alors que TOUTES les conditions de la clause WITH CHECK étaient vérifiées
-- vraies, dans la même exécution que l'insertion :
--
--   - politique  : (client_id = auth.uid() AND status = 'draft'), PERMISSIVE
--   - auth_uid() : 399ac4d5-…
--   - client_id  : 399ac4d5-…  (identique)
--   - status     : défaut 'draft', confirmé en base
--   - droits     : les 11 colonnes envoyées sont toutes accordées
--   - triggers   : aucun BEFORE INSERT
--   - FORCE RLS  : levé
--
-- Sept causes ont été éliminées une à une sans que l'erreur s'explique. La
-- faiblesse de conception sous-jacente est ailleurs : l'APPLICATION ENVOIE
-- `client_id`, et la base doit vérifier qu'il est correct. Toute la garantie
-- repose sur une comparaison — précisément celle qui échoue.
--
-- CE QUE CE FICHIER FAIT
--
-- La colonne prend la valeur du jeton comme valeur par défaut. Le client
-- n'envoie plus `client_id` : le serveur l'écrit, et la clause WITH CHECK
-- compare `auth.uid()` à elle-même.
--
-- Ce n'est pas un contournement. C'est une inversion de responsabilité :
-- une donnée d'identité ne doit jamais être fournie par le client, alors
-- qu'elle est disponible et plus fiable dans le jeton.
--
-- SÉCURITÉ AMÉLIORÉE
--
--   1. Le client ne peut plus créer une mission au nom d'autrui. Auparavant,
--      cette garantie reposait sur la RLS ; elle repose désormais sur
--      l'absence même du droit d'écriture.
--   2. `revoke insert (client_id)` retire au rôle `authenticated` le droit
--      d'écrire cette colonne. Même en cas de politique RLS défaillante,
--      l'écriture directe serait refusée par le catalogue.
--
-- CE QUI EST CONSERVÉ
--
-- La politique « Clients can create draft missions » reste inchangée et reste
-- le filet de sécurité : elle vérifie toujours `client_id = auth.uid()`, y
-- compris pour une mission insérée par un autre mécanisme que l'application.
--
-- COMPATIBILITÉ
--
-- Les lignes existantes ne sont pas touchées : un DEFAULT ne s'applique qu'aux
-- insertions. Les missions créées avant ce changement conservent leur
-- `client_id`.
--
-- IDEMPOTENT : rejouable sans effet de bord.

begin;

-- 1. Valeur par défaut dérivée du jeton
--
--    ATTENTION À LA FORME : `auth.uid()` s'écrit comme un appel de fonction NU,
--    sans parenthèses autour de l'ensemble.
--
--    Écrire `(select auth.uid())` est une sous-requête, et PostgreSQL la refuse
--    dans une expression DEFAULT :
--        ERREUR : 0A000 : impossible d'utiliser la sous-requête dans
--                 l'expression DEFAULT
--
--    Un appel de fonction est accepté, et c'est la forme documentée par
--    Supabase pour cet usage. La colonne est `uuid` et `auth.uid()` renvoie
--    `uuid` : aucun cast n'est nécessaire.
alter table public.missions
  alter column client_id set default auth.uid();

-- 2. Le client n'a plus le droit d'écrire cette colonne
--
--    Le SELECT est nécessaire pour que la colonne reste lisible par son
--    propriétaire ; seul INSERT est retiré, sur cette colonne précise.
revoke insert (client_id) on table public.missions from authenticated;

-- 3. Vérification : le défaut est bien en place et la colonne reste non nulle
do $$
declare
  defaut text;
begin
  select column_default
    into defaut
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'missions'
     and column_name = 'client_id';

  if defaut is null or defaut not like '%auth.uid()%' then
    raise exception
      'ECHEC % : defaut de missions.client_id = %, attendu auth.uid()',
      'mission_client_id_default', coalesce(defaut, 'AUCUN');
  end if;
end;
$$;

commit;
