-- =============================================================================
-- VÉRIFICATION RAPIDE — SECU GUARD (un seul clic)
-- =============================================================================
--
-- Pourquoi ce fichier existe : VERIFICATION_POST_MIGRATION.sql comporte 19
-- controles a lire un par un. Apres des dizaines d'essais, le besoin est un
-- verdict unique, en une seule requete.
--
-- UTILISATION
--   SQL Editor > + New query > coller ce fichier ENTIER > Run
--
-- Uniquement des SELECT : aucune donnee n'est ecrite ni supprimee.
--
-- RESULTAT ATTENDU : uniquement des lignes 'OK', et 0 ligne 'ALERTE'.
-- =============================================================================

with checks(controle, valeur, statut) as (

  -- 1. Les 12 tables doivent exister
  select '1. Tables presentes (13 attendues)'::text,
         (select count(*) from information_schema.tables
           where table_schema = 'public' and table_type = 'BASE TABLE'
             and table_name in ('profiles','profile_roles','agent_profiles',
               'company_profiles','documents','missions','mission_assignments',
               'wallets','transactions','reviews','messages','notifications','villes'))::text,
         case when (select count(*) from information_schema.tables
           where table_schema = 'public' and table_type = 'BASE TABLE'
             and table_name in ('profiles','profile_roles','agent_profiles',
               'company_profiles','documents','missions','mission_assignments',
               'wallets','transactions','reviews','messages','notifications','villes')) = 13
           then 'OK' else 'ALERTE' end

  -- 2. Aucune table publique sans RLS : ce serait une fuite de donnees
  union all
  select '2. Tables sans RLS (attendu 0)',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
         case when (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) = 0
           then 'OK' else 'ALERTE' end

  -- 3. Aucune table sans RLS ni politique
  union all
  select '3. Tables sans RLS ni politique (attendu 0)',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
             and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
         case when (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
             and not exists (select 1 from pg_policy p where p.polrelid = c.oid)) = 0
           then 'OK' else 'ALERTE' end

  -- 4. Nombre de politiques RLS sur le schema public.
  --
  -- ATTENTION A LA LECTURE DU RESULTAT
  --
  -- Ce controle a longtemps annonce « 33 attendues » avec un seuil `>= 33`. Ce
  -- seuil etait trop lax : il laissait passer un ECART sans le dire. La chaine
  -- definit 38 politiques (32 en 00300, 1 en 00600, 1 en 00700, 4 en 01100) ;
  -- la base en comptait 37, et le controle affichait « OK » malgre tout.
  --
  -- L'ecart valait exactement la politique d'insertion de `mission_assignments`,
  -- celle que le `DROP TABLE ... CASCADE` de 000001_reset_all.sql avait
  -- emportee. Le controle 12 la voyait bien, mais le bilan global, lui,
  -- restait vert : c'est exactement le faux vert que ce fichier doit empecher.
  --
  -- Le seuil est donc porte a 38, et l'ecart est nomme explicitement.
  union all
  select '4. Politiques RLS (38 attendues)',
         (select count(*)::text from pg_policy p join pg_class c on c.oid = p.polrelid
           join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'),
         case when (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
           join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public') >= 38
           then 'OK' else 'ALERTE' end

  -- 5. Ecriture interdite sur les colonnes sensibles
  union all
  select '5. Ecriture colonnes sensibles (attendu 0)',
         (select count(*)::text from information_schema.column_privileges
           where table_schema = 'public' and grantee = 'authenticated'
             and privilege_type in ('UPDATE','INSERT','ALL')
             and ((table_name = 'profiles' and column_name in ('role','email'))
               or (table_name = 'missions' and column_name = 'status')
               or (table_name = 'mission_assignments' and column_name = 'status'))),
         case when (select count(*) from information_schema.column_privileges
           where table_schema = 'public' and grantee = 'authenticated'
             and privilege_type in ('UPDATE','INSERT','ALL')
             and ((table_name = 'profiles' and column_name in ('role','email'))
               or (table_name = 'missions' and column_name = 'status')
               or (table_name = 'mission_assignments' and column_name = 'status'))) = 0
           then 'OK' else 'ALERTE' end

  -- 6. Le client ne doit pas pouvoir creer un profil : il pourrait s attribuer admin
  union all
  select '6. Client ne peut pas creer un profil (attendu 0)',
         (select count(*)::text from information_schema.role_table_grants
           where table_schema = 'public' and table_name = 'profiles'
             and grantee = 'authenticated' and privilege_type in ('INSERT','ALL')),
         case when (select count(*) from information_schema.role_table_grants
           where table_schema = 'public' and table_name = 'profiles'
             and grantee = 'authenticated' and privilege_type in ('INSERT','ALL')) = 0
           then 'OK' else 'ALERTE' end

  -- 7. Colonnes attendues sur profiles et missions
  union all
  select '7. Colonnes profiles+missions (21 attendues)',
         ((select count(*) from information_schema.columns
            where table_schema = 'public' and table_name = 'profiles'
              and column_name in ('id','email','full_name','phone','role',
                                 'avatar_url','created_at','updated_at'))
        + (select count(*) from information_schema.columns
            where table_schema = 'public' and table_name = 'missions'
              and column_name in ('id','client_id','title','description','address',
                'city','postal_code','start_time','end_time','agent_count',
                'budget','status','special_requirements')))::text,
         case when ((select count(*) from information_schema.columns
            where table_schema = 'public' and table_name = 'profiles'
              and column_name in ('id','email','full_name','phone','role',
                                 'avatar_url','created_at','updated_at'))
        + (select count(*) from information_schema.columns
            where table_schema = 'public' and table_name = 'missions'
              and column_name in ('id','client_id','title','description','address',
                'city','postal_code','start_time','end_time','agent_count',
                'budget','status','special_requirements'))) = 21
           then 'OK' else 'ALERTE' end

  -- 8. Triggers de bootstrap a l inscription : sans eux, aucun compte ne se cree
  union all
  select '8. Triggers inscription (2 attendus)',
         (select count(*)::text from pg_trigger
           where not tgisinternal
             and tgname in ('on_auth_user_created_secuguard','on_profile_created_wallet')
             and tgenabled = 'O'),
         case when (select count(*) from pg_trigger
           where not tgisinternal
             and tgname in ('on_auth_user_created_secuguard','on_profile_created_wallet')
             and tgenabled = 'O') = 2
           then 'OK' else 'ALERTE' end

  -- 9. FORCE RLS absent sur les 3 tables ecrites par les triggers
  union all
  select '9. FORCE RLS absent sur profiles/profile_roles/wallets',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public'
             and c.relname in ('profiles','profile_roles','wallets')
             and c.relforcerowsecurity),
         case when (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public'
             and c.relname in ('profiles','profile_roles','wallets')
             and c.relforcerowsecurity) = 0
           then 'OK' else 'ALERTE' end

  -- 10. Les 8 fonctions de transition d etat
  union all
  select '10. Fonctions de transition (8 attendues)',
         (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in (
             'publish_mission','cancel_mission','complete_mission',
             'mark_mission_paid','open_mission_dispute',
             'accept_assignment','reject_assignment','complete_assignment')),
         case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in (
             'publish_mission','cancel_mission','complete_mission',
             'mark_mission_paid','open_mission_dispute',
             'accept_assignment','reject_assignment','complete_assignment')) = 8
           then 'OK' else 'ALERTE' end

  -- 11. Helper d affectation, ajoute par la migration 00600
  union all
  select '11. Helper can_assign_mission',
         (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'private' and p.proname = 'can_assign_mission'),
         case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'private' and p.proname = 'can_assign_mission') = 1
           then 'OK' else 'ALERTE' end

  -- 12. Politique d insertion des affectations, ajoutee par la migration 00600
  union all
  select '12. Politique insert mission_assignments',
         (select count(*)::text from pg_policy
           where polrelid = 'public.mission_assignments'::regclass and polcmd = 'i'),
         case when (select count(*) from pg_policy
           where polrelid = 'public.mission_assignments'::regclass and polcmd = 'i') = 1
           then 'OK' else 'ALERTE' end

  -- 13. anon ne doit avoir aucun droit d ecriture
  union all
  select '13. Droits d ecriture pour anon (attendu 0)',
         (select count(*)::text from information_schema.role_table_grants
           where table_schema = 'public' and grantee = 'anon'
             and privilege_type in ('INSERT','UPDATE','DELETE','ALL')),
         case when (select count(*) from information_schema.role_table_grants
           where table_schema = 'public' and grantee = 'anon'
             and privilege_type in ('INSERT','UPDATE','DELETE','ALL')) = 0
           then 'OK' else 'ALERTE' end

  -- 14. Cles etrangeres : 14 minimum apres la reconstruction du 2026-09-26.
  -- La suppression en cascade de profiles et missions avait supprime ces
  -- contraintes SANS supprimer les tables qui les portaient : l'integrite
  -- referentielle etait silencieusement rompue. La migration 01000 les recree.
  -- Ce controle empeche la regression.
  union all
  select '14. Cles etrangeres actives (14 attendues)',
         (select count(*)::text from pg_constraint
           where contype = 'f' and connamespace = 'public'::regnamespace
             and confrelid in ('public.profiles'::regclass, 'public.missions'::regclass)),
         case when (select count(*) from pg_constraint
           where contype = 'f' and connamespace = 'public'::regnamespace
             and confrelid in ('public.profiles'::regclass, 'public.missions'::regclass)) >= 14
           then 'OK' else 'ALERTE' end

  -- 15. Referentiel des villes : l ecriture doit etre reservee a l admin.
  --
  -- ATTENTION : ce controle ne doit PAS porter sur les droits `anon`.
  -- `anon` ne recoit rien sur `villes`, donc un controle base sur ce role
  -- passe toujours, meme si la table etait entierement ouverte.
  --
  -- La migration 01100 accorde volontairement INSERT/UPDATE/DELETE a
  -- `authenticated` : c'est un choix de defense en profondeur, la couche RLS
  -- devant rester le verrou reel. Le controle porte donc sur les POLITIQUES,
  -- seul element qui distingue un administrateur d'un client.
  --
  -- On verifie que chaque politique d'ecriture de `villes` mentionne
  -- `is_admin`. Une regression du type `for insert with check (true)` laisserait
  -- passer le test par les droits tout en ouvrant la table au client.
  union all
  select '15. Villes : ecriture reservee a l admin (attendu 0)',
         (select count(*)::text from pg_policy
           where polrelid = 'public.villes'::regclass
             and polcmd <> 'r'
             and (coalesce(pg_get_expr(polqual, polrelid), '')
               || coalesce(pg_get_expr(polwithcheck, polrelid), ''))
               not like '%is_admin%'),
         case when (select count(*) from pg_policy
           where polrelid = 'public.villes'::regclass
             and polcmd <> 'r'
             and (coalesce(pg_get_expr(polqual, polrelid), '')
               || coalesce(pg_get_expr(polwithcheck, polrelid), ''))
               not like '%is_admin%') = 0
           then 'OK' else 'ALERTE' end

  -- 16. Villes actives : sans aucune ville, aucun formulaire de mission n est
  -- remplissable. Ce n est pas une faille de securite, mais un blocage
  -- fonctionnel immediat.
  union all
  select '16. Villes actives (1 minimum)',
         (select count(*)::text from public.villes where active),
         case when (select count(*) from public.villes where active) >= 1
           then 'OK' else 'ALERTE' end

  -- 17. AUCUNE SONDE DE DIAGNOSTIC dans le schema public.
  --
  -- `public.diagnostic_rls()` a ete installee temporairement pour mesurer
  -- `auth.uid()` dans le role `authenticated` (migration 20260926001300), puis
  -- retiree par la migration 20260926001500.
  --
  -- Elle ne donne acces a aucune donnee utilisateur, seulement a des
  -- metadonnees de catalogue. Mais elle DECRIT la politique RLS de `missions` et
  -- les droits accordes : c'est une cartographie offerte a quiconque est
  -- authentifie, et elle n'a rien a faire dans un code livre.
  --
  -- Ce controle a ete ajoute le 2026-09-27 apres avoir constate que la fonction
  -- etait TOUJOURS exposee en production, alors que `check:supabase` annonçait
  -- « conforme ». Le script ne cherchait que les 8 fonctions de transition, et
  -- ignorait tout ce qui n'en faisait pas partie.
  union all
  select '17. Sonde de diagnostic absente (attendu 0)',
         (select count(*)::text from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname like 'diagnostic%'),
         case when (select count(*) from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname like 'diagnostic%') = 0
           then 'OK' else 'ALERTE' end

  -- 18. missions.client_id porte un DEFAULT derive du jeton.
  --
  -- C'est le CORRECTIF de P1 (migration 20260926001400), et c'est le controle le
  -- plus important de ce fichier pour le prochain test fonctionnel.
  --
  -- Rappel du defaut encountere : l'insertion d'une mission echouait avec
  -- « new row violates row-level security policy for table "missions" » alors
  -- que TOUTES les conditions de la clause WITH CHECK etaient verifiees vraies.
  -- La base etait saine : le defaut etait dans l'emission de la requete.
  --
  -- Le correctif inverse la responsabilite : la colonne prend `auth.uid()` comme
  -- valeur par defaut, et le role `authenticated` perd le droit d'ecrire cette
  -- colonne. Le serveur ecrit l'identite, le client ne peut plus le forger.
  --
  -- SANS CE CONTROLE, rien ne signalait que le correctif etait applique ou non :
  -- la verification s'arretait au controle 12, qui ne parle pas de `missions`.
  union all
  select '18. missions.client_id : defaut auth.uid() pose',
         (select coalesce(column_default, 'AUCUN') from information_schema.columns
           where table_schema = 'public' and table_name = 'missions'
             and column_name = 'client_id'),
         case when (select column_default from information_schema.columns
           where table_schema = 'public' and table_name = 'missions'
             and column_name = 'client_id') like '%auth.uid()%'
           then 'OK' else 'ALERTE' end

  -- 19. missions.client_id : le client ne doit plus pouvoir ecrire cette colonne.
  --
  -- Controle JUMELE du 18, et il compte autant que lui. Un DEFAULT sans REVOKE
  -- n'accomplit rien : le client pourrait toujours envoyer un `client_id` forge,
  -- et le defaut ne s'appliquerait que s'il l'omet. C'est le REVOKE qui fait de
  -- l'inversion de responsabilite une garantie, et non une convenance.
  union all
  select '19. missions.client_id : ecriture retiree au client (attendu 0)',
         (select count(*)::text from information_schema.column_privileges
           where table_schema = 'public' and table_name = 'missions'
             and column_name = 'client_id' and grantee = 'authenticated'
             and privilege_type in ('INSERT','UPDATE','ALL')),
         case when (select count(*) from information_schema.column_privileges
           where table_schema = 'public' and table_name = 'missions'
             and column_name = 'client_id' and grantee = 'authenticated'
             and privilege_type in ('INSERT','UPDATE','ALL')) = 0
           then 'OK' else 'ALERTE' end
)

select controle, valeur, statut,
       case when statut = 'OK' then 'OK' else 'ALERTE' end as verdict
from checks
order by (statut <> 'OK'), controle;