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
  -- seuil etait trop lax : il laissait passer un ECART sans le dire.
  --
  -- Un seuil trop lax produit un faux VERT. Un compte ERRONE produit un faux
  -- ALERTE : c'est ce qu'ont fait les controles 18 et 19, qui mesuraient un
  -- design remplace sans jamais le dire. Un controle doit etre lu autant que la
  -- base : la base peut etre saine et le controle, faux.
  --
  -- L'ecart valait exactement la politique d'insertion de `mission_assignments`,
  -- celle que le `DROP TABLE ... CASCADE` de 000001_reset_all.sql avait
  -- emportee. Le controle 12 la voyait bien, mais le bilan global, lui,
  -- restait vert : c'est exactement le faux vert que ce fichier doit empecher.
  --
  -- COMPTE CORRECT, ETABLI SUR LES FICHIERS ET NON SUR UNE CONVENTION
  --
  -- La chaine definit 37 politiques, et non 38. Le detail compte, parce que
  -- c'est lui qui avait produit le 38 :
  --
  --   20260925000300  32
  --   20260925000600   1   "Mission owners can create assignments"
  --   20260925000700   0   <-- le `create policy` y est dans un COMMENTAIRE
  --   20260925001100   4
  --   20260926001200   1   meme NOM que 00600 : il la REMPLACE, pas ne s'y ajoute
  --                   ---
  --                    37
  --
  -- Les deux erreurs qui donnaient 38 :
  --
  --   1. 00700 ne cree AUCUNE politique : il retire `force row level security`
  --      de trois tables. Sa ligne 35 est un commentaire qui CITE une politique
  --      pour expliquer un echec d'inscription ; un compteur de `create policy`
  --      la prenait pour une creation.
  --   2. 00600 et 01200 creent la meme politique, au meme nom. Les additionner
  --      compte deux fois une politique qui n'existe qu'une fois en base.
  --
  -- 37 = ce que la base contient reelelement. Le seuil passe donc a 37, et
  -- l'ecart reste nomme explicitement.
  union all
  select '4. Politiques RLS (37 attendues)',
         (select count(*)::text from pg_policy p join pg_class c on c.oid = p.polrelid
           join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'),
         case when (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
           join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public') >= 37
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
  --     puis restauree par 20260926001200.
  --
  -- ⚠️ ATTENTION — LECTURE DE `polcmd`
  --
  -- Les valeurs de `pg_policy.polcmd` ne sont PAS les lettres du SQL.
  -- `insert` vaut **'a'** (comme « append »), et non 'i' :
  --
  --   *  = ALL      r = SELECT     a = INSERT
  --   w  = UPDATE   d = DELETE
  --
  -- Ce controle a longtemps cherche `polcmd = 'i'`, une valeur qui N'EXISTE
  -- PAS dans PostgreSQL. Il comptait donc toujours zero, et annoncait
  -- systematiquement « ALERTE » — y compris lorsque la politique etait
  -- parfaitement installee.
  --
  -- C'est un faux positif, et il a oriente le diagnostic pendant des jours vers
  -- une politique absente alors que la question n'etait pas posee. La preuve
  -- qu'elle existe : la migration 01200, rejouee le 2026-09-27, a echoue sur
  -- SON PROPRE controle en renvoyant « a,r,w » — c'est-a-dire exactement
  -- « insertion, selection, mise a jour » presentes. L'alerte venait du
  -- separateur du test, pas de l'etat de la base.
  union all
  select '12. Politique insert mission_assignments',
         (select count(*)::text from pg_policy
           where polrelid = 'public.mission_assignments'::regclass and polcmd = 'a'),
         case when (select count(*) from pg_policy
           where polrelid = 'public.mission_assignments'::regclass and polcmd = 'a') = 1
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

  -- 18. `missions.client_id` : identite IMPOSEE par un trigger BEFORE INSERT.
  --
  -- CES DEUX CONTROLES ONT MESURE UN DESIGN REMPLACE. Ils annoncaient 18 et 19
  -- sur une base SAINE, et les deux affichaient ALERTE.
  --
  -- Ils verifiaient la migration 20260926001400 :
  --
  --     alter table public.missions
  --       alter column client_id set default auth.uid();
  --     revoke insert (client_id) on table public.missions from authenticated;
  --
  -- La migration 20260926001600 l'INVERSE, et sa propre auto-verification echoue
  -- si le DEFAULT existe encore OU si le droit INSERT manque. Les valeurs mesurees
  -- (aucun default, un droit INSERT) sont donc exactement celles que 0160 produit :
  -- 01600 EST APPLIQUEE. C'est le controle qui etait faux, pas la base.
  --
  -- POURQUOI LE DEFAULT NE POUVAIT PAS MARCHER
  --
  -- Un DEFAULT n'est pas de la donnee : PostgreSQL l'evalue en PREPARANT
  -- l'instruction. Via PostgREST, cette preparation a lieu dans le contexte du
  -- role *preparer*, AVANT que le jeton de la requete ne soit installe :
  -- `auth.uid()` y renvoie NULL. `client_id` valait NULL, la clause
  -- `client_id = auth.uid()` s'evaluait a NULL donc fausse, et la politique
  -- refusait la ligne -- et les deux tests le disaient, sans qu'aucune des
  -- conditions de WITH CHECK ne soit fausse.
  --
  -- 01600 corrige au bon moment : un trigger BEFORE INSERT s'execute pendant
  -- l'EXECUTION, donc dans le contexte du role appelant, ou le jeton EST pose.
  --
  -- CE QUE CES CONTROLES MESURENT MAINTENANT
  --
  -- 18 : le trigger est present, actif, et le DEFAULT a bien disparu.
  -- 19 : le droit INSERT existe ET le trigger existe. C'est cette paire qui
  --      constitue la garantie, pas le droit seul.
  --
  -- 19 merite une attention particuliere : le droit INSERT sur `client_id` est
  -- REACCORDE, et c'est voulu. PostgreSQL refuse d'inserer une colonne sans
  -- droit, meme si un trigger va la reecrire. Le droit est donc la, et la VALEUR
  -- ne l'est pas : `new.client_id := auth.uid()` l'ecrase inconditionnellement.
  -- Un client peut envoyer n'importe quel `client_id` ; il sera ignore.
  --
  -- C'est la garantie la plus forte du schema : elle ne repose ni sur une
  -- comparaison, ni sur l'absence d'un droit, mais sur une ECRITURE INCONDITIONNELLE.
  -- Un controle qui compterait 0 droits ICI — l'ancien controle 19 — afficherait
  -- ALERTE sur une base mieux protegee qu'avant.
  --
  -- Ces deux controles ne disent pas que l'insertion fonctionne : ils disent que
  -- le mecanisme est en place. La preuve reste un test fonctionnel.
  --
  -- 18.
  --
  -- `trg_force_mission_client_id` doit exister, etre actif, et le DEFAULT
  -- `auth.uid()` ne doit plus etre la. Les DEUX conditions sont exigees : un
  -- trigger sans la suppression du DEFAULT laisserait les deux mecanismes
  -- cohabiter, et 01600 echouerait sur ce point precis.
  union all
  -- Les GUILLEMETS SIMPLES ci-dessous sont NON NEGOCIABLES, comme partout dans
  -- ce fichier.
  --
  -- Le 2026-09-27, ces deux libelles ont ete ecrits entre guillemets DOUBLES,
  -- pour « echapper » une apostrophe qui n'existait pas dans le texte. Le script
  -- n'a donc plus jamais demarre, et l'echec etait total :
  --
  --     ERROR: 42703: column "18. missions.client_id : ..." does not exist
  --
  -- En SQL, `"..."` designe un IDENTIFIANT — une colonne — et NON une chaine.
  -- Un libelle ecrit ainsi est recherche dans une table qui n'existe pas ici.
  --
  -- L'echec porte sur la LIGNE, donc sur TOUTE la requete : les controles 1 a
  -- 17 ne s'affichent meme pas. C'est la 5e fois qu'un controle defaillant
  -- produit un « tout va bien » trompeur en amont — le defaut inverse de ceux
  -- deja corriges, et tout aussi grave : ici, le controle ne ment pas, il ne
  -- repond pas du tout.
  --
  -- REGLE : un libelle se met entre guillemets SIMPLES. S'il contient une
  -- apostrophe, on la double — 'missions.client_id : d''agent' — et surtout on
  -- ne change pas de delencheur pour une raison imaginée.
  select '18. missions.client_id : trigger actif, DEFAULT absent',
         (select case
                  when exists (select 1 from pg_trigger t
                                where t.tgrelid = 'public.missions'::regclass
                                  and not t.tgisinternal
                                  and t.tgenabled = 'O'
                                  and t.tgname = 'trg_force_mission_client_id')
                   and exists (select 1 from information_schema.columns
                                where table_schema = 'public'
                                  and table_name = 'missions'
                                  and column_name = 'client_id'
                                  and column_default is not null)
                   then 'trigger ACTIF + DEFAULT PRESENT'
                  when exists (select 1 from pg_trigger t
                                where t.tgrelid = 'public.missions'::regclass
                                  and not t.tgisinternal
                                  and t.tgenabled = 'O'
                                  and t.tgname = 'trg_force_mission_client_id')
                   then 'trigger ACTIF, DEFAULT absent'
                  else 'trigger ABSENT ou desactive'
                end),
         case when
                exists (select 1 from pg_trigger t
                         where t.tgrelid = 'public.missions'::regclass
                           and not t.tgisinternal
                           and t.tgenabled = 'O'
                           and t.tgname = 'trg_force_mission_client_id')
              and not exists (select 1 from information_schema.columns
                                where table_schema = 'public'
                                  and table_name = 'missions'
                                  and column_name = 'client_id'
                                  and column_default is not null)
           then 'OK' else 'ALERTE' end

  -- 19. missions.client_id : le droit existe, et il est SANS PUISSANCE.
  --
  -- On mesure la PAIRE, jamais le droit seul. Un droit INSERT sans trigger
  -- laisserait le client choisir l'identite ; un trigger sans droit rendrait
  -- l'insertion impossible. C'est leur ensemble qui garantit la valeur.
  --
  -- Le second critere verifie que la fonction du trigger est bien
  -- `SECURITY DEFINER` : c'est ce qui permet au trigger d'ecrire `client_id`
  -- alors que l'appelant n'a pas reellement le droit de la choisir. Une fonction
  -- ordinaire ne fonctionnerait pas ici.
  union all
  select '19. missions.client_id : valeur imposee (droit + trigger)',
         (select case
                  when exists (select 1 from information_schema.column_privileges
                                where table_schema = 'public'
                                  and table_name = 'missions'
                                  and column_name = 'client_id'
                                  and grantee = 'authenticated'
                                  and privilege_type = 'INSERT')
                   and exists (select 1 from pg_trigger t
                                where t.tgrelid = 'public.missions'::regclass
                                  and not t.tgisinternal
                                  and t.tgenabled = 'O'
                                  and t.tgname = 'trg_force_mission_client_id')
                   and exists (select 1 from pg_proc p
                                join pg_namespace n on n.oid = p.pronamespace
                                where n.nspname = 'private'
                                  and p.proname = 'force_mission_client_id'
                                  and p.prosecdef)
                   then 'droit INSERT + trigger SECURITY DEFINER'
                  else 'INCOMPLET'
                end),
         case when
                exists (select 1 from information_schema.column_privileges
                         where table_schema = 'public'
                           and table_name = 'missions'
                           and column_name = 'client_id'
                           and grantee = 'authenticated'
                           and privilege_type = 'INSERT')
              and exists (select 1 from pg_trigger t
                         where t.tgrelid = 'public.missions'::regclass
                           and not t.tgisinternal
                           and t.tgenabled = 'O'
                           and t.tgname = 'trg_force_mission_client_id')
              and exists (select 1 from pg_proc p
                           join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'private'
                             and p.proname = 'force_mission_client_id'
                             and p.prosecdef)
           then 'OK' else 'ALERTE' end
  -- 20. Droits d'ecriture de l'affectation : les 4 colonnes annoncees, RIEN
  --     D'AUTRE.
  --
  --     LE CONTROLE 12 NE SUFFIT PAS. Il mesure la POLITIQUE. Il ne mesure pas
  --     le DROIT — qui est une autre couche, et qui tombea elle aussi lors du
  --     `DROP TABLE ... CASCADE` de 000001_reset_all.sql.
  --
  --     C'est le meme piege que le `grant select` manquant sur agent_profiles :
  --     la politique est en place, la requete echoue quand meme, et aucun
  --     controle ne regardait le droit. Le parcours d'affectation reposait donc
  --     sur une garantie que rien ne verifiait.
  --
  --     On mesure les DEUX moities, et dans les deux sens :
  --       - les 4 colonnes accordees (mission_id, agent_id, company_id,
  --         proposed_rate) doivent etre presentes ;
  --       - `status`, `report` et les horodatages de pointage doivent en etre
  --         ABSENTS. C'est ce qui empeche un client de s'ecrire `accepted`, ou
  --         de se declarer pointe, sans passer par les fonctions de transition.
  union all
  select '20. Droits insert affectations (4 colonnes, status exclu)',
         (select count(*)::text from information_schema.column_privileges
           where table_schema = 'public' and table_name = 'mission_assignments'
             and grantee = 'authenticated' and privilege_type = 'INSERT'),
         case when (select count(*) from information_schema.column_privileges
           where table_schema = 'public' and table_name = 'mission_assignments'
             and grantee = 'authenticated' and privilege_type = 'INSERT') >= 4
           and not exists (select 1 from information_schema.column_privileges
             where table_schema = 'public' and table_name = 'mission_assignments'
               and grantee = 'authenticated' and privilege_type = 'INSERT'
               and column_name in ('id', 'status', 'report',
                                   'check_in_time', 'check_out_time'))
           then 'OK' else 'ALERTE' end

  -- 21. Visibilite des prestataires par un client — 01900 et 02000.
  --
  --     Ces deux migrations ont corrige le 4eme defaut du projet : la recherche
  --     d'un client ne renvoyait rien, parce que la politique de lecture de
  --     `agent_profiles` etait restreinte a l'agent lui-meme et a l'admin. La
  --     liste etait vide PAR CONSTRUCTION, quel que soit le nombre de fiches.
  --
  --     AUCUN CONTROLE NE LES COUVRAIT. Ni `check:supabase`, qui ne teste que
  --     le role `anon`, ni les 19 controles d'ici. Elles n'etaient garanties par
  --     rien : une regression les effacerait sans qu'aucun signal ne tire.
  --
  --     On mesure les DEUX causes possibles d'un resultat vide, parce qu'elles
  --     produisent le meme symptome et ne se diagnostiquent pas de la meme facon :
  --
  --       1. LA POLITIQUE doit mentionner 'registered' et 'validated'. Sans
  --          cela, aucun client ne peut lire une fiche.
  --       2. LA FONCTION `public.liste_agents_publics` doit exister et etre
  --          `security definer`. PostgREST n'expose QUE le schema `public` :
  --          si le wrapper disparait, l'appel `/rest/v1/rpc/` renvoie un 404
  --          SILENCIEUX, et l'ecran affiche encore « aucun prestataire » — meme
  --          symptome, cause totalement differente.
  --
  --     `security definer` est exige parce que la fonction interroge `private`
  --     et `profiles`, que l'appelant ne peut pas lire.
  union all
  select '21. Prestataires lisibles par un client (01900 + 02000)',
         (select case
            when exists (select 1 from pg_policy
                          where polrelid = 'public.agent_profiles'::regclass
                            and polcmd = 'r'
                            and pg_get_expr(polqual, polrelid) like '%''registered''%'
                            and pg_get_expr(polqual, polrelid) like '%''validated''%')
             and exists (select 1 from pg_proc p
                          join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public'
                           and p.proname = 'liste_agents_publics'
                           and p.prosecdef)
              then 'politique ouverte + fonction publique presente'
            else 'POLITIQUE FERMEE ou FONCTION ABSENTE'
            end),
         case when exists (select 1 from pg_policy
                            where polrelid = 'public.agent_profiles'::regclass
                              and polcmd = 'r'
                              and pg_get_expr(polqual, polrelid) like '%''registered''%'
                              and pg_get_expr(polqual, polrelid) like '%''validated''%')
           and exists (select 1 from pg_proc p
                        join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public'
                         and p.proname = 'liste_agents_publics'
                         and p.prosecdef)
           then 'OK' else 'ALERTE' end

  -- 22. Les SOCIÉTÉS sont lisibles par un client — 2026-09-28.
  --
  --     LE CONTRÔLE 21 NE VOIT QUE LES AGENTS, ET C'EST LE TROU QU'IL NE
  --     VOYAIT PAS.
  --
  --     La politique de lecture de `company_profiles` restreignait l'accès à la
  --     société elle-même et à l'administrateur. La recherche interroge pourtant
  --     cette table : elle renvoyait donc **zéro société**, sans erreur et sans
  --     journal. Le test du 2026-09-27 a trouvé un agent, et l'absence de
  --     sociétés n'a pas été remarkée.
  --
  --     C'est le défaut corrigé par `01900` pour `agent_profiles`, jamais repris
  --     pour `company_profiles` — et le contrôle 21, écrit le même jour, n'a
  --     regardé que la table que `01900` venait de corriger.
  --
  --     On exige les MÊMES deux statuts que pour les agents : `registered` et
  --     `validated`. `rejected` et `suspended` doivent rester invisibles, sinon
  --     la validation par un administrateur n'aurait aucun effet.
  --
  --     ET ON EXIGE QUE `FORCE` SOIT TOUJOURS ACTIF SUR LES DEUX TABLES.
  --     Les fonctions de l'annuaire sont en `SECURITY DEFINER` : sans `force`,
  --     le propriétaire n'est soumis à aucune politique et la fonction
  --     renverrait **toutes** les fiches, y compris rejetées. Aucun autre
  --     contrôle ne le verrait, et le retrait serait indolore.
  union all
  select '22. Societes lisibles + FORCE actif sur les 2 tables',
         (select case
            when (select count(*) from pg_class c
                    join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'public'
                     and c.relname in ('agent_profiles', 'company_profiles')
                     and c.relforcerowsecurity) = 2
             and exists (select 1 from pg_policy
                          where polrelid = 'public.company_profiles'::regclass
                            and polcmd = 'r'
                            and pg_get_expr(polqual, polrelid) like '%''registered''%'
                            and pg_get_expr(polqual, polrelid) like '%''validated''%')
             and exists (select 1 from pg_proc p
                          join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public'
                           and p.proname = 'prestataires_par_ids'
                           and p.prosecdef)
              then 'politique ouverte, FORCE actif, fonction presente'
            else 'POLITIQUE FERMEE, FORCE MANQUANT ou FONCTION ABSENTE'
            end),
         case when (select count(*) from pg_class c
                     join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname = 'public'
                      and c.relname in ('agent_profiles', 'company_profiles')
                      and c.relforcerowsecurity) = 2
           and exists (select 1 from pg_policy
                        where polrelid = 'public.company_profiles'::regclass
                          and polcmd = 'r'
                          and pg_get_expr(polqual, polrelid) like '%''registered''%'
                          and pg_get_expr(polqual, polrelid) like '%''validated''%')
           and exists (select 1 from pg_proc p
                        join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public'
                         and p.proname = 'prestataires_par_ids'
                         and p.prosecdef)
           then 'OK' else 'ALERTE' end


)

select controle, valeur, statut,
       case when statut = 'OK' then 'OK' else 'ALERTE' end as verdict
from checks
order by (statut <> 'OK'), controle;