-- =============================================================================
-- DROITS D'ÉCRITURE — `agent_profiles`
-- =============================================================================
--
-- POURQUOI CE CONTRÔLE
--
-- L'écran « Ma fiche professionnelle » échoue sur :
--
--     permission denied for table agent_profiles
--
-- Ce message désigne un GRANT manquant, pas une violation RLS. Il faut donc
-- mesurer le GRANT lui-même.
--
-- LECTURE DU RÉSULTAT
--
--   6 lignes  -> 20260926001800 EST appliquée, et le problème est ailleurs
--   0 ligne   -> 20260926001800 n'est PAS appliquée
--
-- Les 6 colonnes attendues sont celles accordées par la migration 00300 :
--
--     profile_id, certification_number, certification_expiry,
--     hourly_rate, zone, bio
--
-- `id`, `status`, `created_at` et `updated_at` doivent en être ABSENTS : ils
-- n'appartiennent pas à l'agent, et les voir ici signifierait qu'un droit
-- trop large a été accordé.
--
-- AUCUNE ÉCRITURE : ce contrôle est un SELECT pur.

select
  column_name,
  grantee,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'agent_profiles'
  and grantee = 'authenticated'
  and privilege_type = 'INSERT'
order by column_name;
