-- Retrait de la sonde de diagnostic RLS — 2026-09-26.
--
-- POURQUOI
--
-- La migration `20260926001300_diagnostic_rls.sql` a créé
-- `public.diagnostic_rls()`, accessible au rôle `authenticated`, afin de
-- mesurer `auth.uid()` dans le contexte réel de l'insertion qui échouait.
--
-- Son travail est terminé : la mesure a été faite, et le correctif
-- `20260926001400_mission_client_id_default.sql` est écrit. La fonction
-- n'a plus aucune raison d'exister en production.
--
-- Elle ne donnait accès à aucune donnée utilisateur — uniquement à des
-- métadonnées de catalogue — mais une fonction de diagnostic exposée dans le
-- schéma `public` décrit la politique RLS et les droits accordés à quiconque
-- est authentifié. C'est une cartographie gratuite pour un attaquant, et elle
-- n'a rien à faire dans un code livré.
--
-- POURQUOI CE FICHIER PLUTÔT QUE SUPPRIMER 01300
--
-- Effacer le fichier `01300` laisserait un environnement reconstruit à partir
-- du dépôt sans la fonction, mais ferait perdre la trace de ce qui a été
-- installé. Cette migration conserve l'historique tout en garantissant que
-- l'état final soit propre, quel que soit l'ordre d'exécution.
--
-- IDEMPOTENT.

begin;

drop function if exists public.diagnostic_rls();

-- Vérification : la fonction ne doit plus exister dans le catalogue.
do $$
begin
  if exists (select 1 from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'diagnostic_rls') then
    raise exception
      'ECHEC % : public.diagnostic_rls existe encore après le DROP',
      'diagnostic_drop';
  end if;
end;
$$;

commit;
