-- ============================================================================
-- Les agents deviennent visibles par les clients — 2026-09-27
-- ============================================================================
--
-- LE SYMPTOME
--
-- La recherche affiche « AUCUN PRESTATAIRE TROUVE » alors qu'une fiche agent
-- existe en base et que la creation ET la modification de cette fiche
-- fonctionnent. Aucun filtre cote client : `providersService.search()` ne
-- filtre pas sur `status`, volontairement.
--
-- LA CAUSE : UNE POLITIQUE, PAS UNE DONNEE
--
-- `20260925000300` definit, pour la lecture de `agent_profiles` :
--
--   create policy "Agents can view own or company-linked profile"
--     for select using (
--       profile_id = (select auth.uid()) or private.is_admin()
--     )
--
-- Lisible par : l'agent lui-meme, ou un administrateur. **Pas par un client.**
--
-- Donc la recherche d'un client ne peut RIEN renvoyer, quel que soit le
-- nombre de fiches : la liste etait vide par construction, pas par accident.
--
-- C'est un defaut de conception de la politique,heritee telle quelle du modele
-- de missions — ou la visibility par les participants est une CONTRAINTE du
-- modele. Pour un catalogue de prestataires, elle n'a pas lieu d'etre.
--
-- ⚠️ TROIS INTERROGATIONS SANS CONTROLE, DANS CE PROJET
--
-- Ce n'est pas la premiere fois qu'un manque se cache derriere un vert :
--
--   - mission_assignments : aucune politique insert -> parcours d'affectation
--     structurellement impossible. Le controle 12 l'a vu, le bilan, non.
--   - le 'DEFAULT auth.uid()' de 01400 : evalue avant l'installation du jeton,
--     donc NULL. Controle 18 le mesurait, sans mesurer le bon moment.
--   - `agent_profiles` : la SEULE table de metier sans politique de lecture
--     pour les clients. Aucune table temoin, aucune ligne de controle, aucun
--     test fonctionnel. Personne ne l'avait remarke.
--
-- L'absence de controle ne prouve rien. Elle ne prouve surtout pas l'absence
-- de defaut.
--
-- LE CHOIX FAIT, ET SON LIMITE
--
-- Un agent en attente (`status = 'registered'`) devient visible de tous.
--
-- On pourrait exiger `'validated'`, et ce serait defendable : un client ne
-- doit pas trouver un agent non accredite. Mais alors la creation de fiche
-- n'a AUCUN effet observable tant qu'un administrateur n'intervient pas, et
-- l'ecran « Ma fiche professionnelle » paraitrait sans effet.
--
-- La visibilite d'une fiche et sa VALIDATION sont donc deux choses distinctes :
-- la premiere est un probleme d'interface, resolu ici ; la seconde reste un
-- acte d'administration, avec l'ecran d'administration correspondant.
--
-- Si la regle metier souhaite `'validated'`, le correctif est le meme : une
-- ligne a changer, et le statut de la fiche a passer. C'est une decision
-- produit, pas un defaut technique.
--
-- CE QUE CE CHANGEMENT NE FAIT PAS
--
--   - Il ne touche ni aux grants, ni aux politiques d'ecriture : un agent ne
--     peut toujours creer que SA fiche, et la modifier que sienne.
--   - Il n'expose aucun profil `'rejected'`. Les clients voient `registered`
--     et `validated`. `rejected` n'est pas dans la liste.
--   - Il ne rend pas la fiche reservable : c'est le parcours d'affectation, qui
--     reste a tester.
--
-- LECTURE SEULE : ce fichier ne modifie que la politique de SELECT. Aucune
-- donnee n'est touchee, aucune ligne n'est inseree.
--
-- IDEMPOTENT : la politique est supprimee avant d'etre recreee.
--
-- ⚠️ NE PAS REJOUER `20260925000300` APRES CE FICHIER. Il repose cette
-- politique, et la visibilite disparaitrait.
-- ---------------------------------------------------------------------------

begin;

drop policy if exists "Agents can view own or company-linked profile"
  on public.agent_profiles;

create policy "Agents can view own or company-linked profile"
  on public.agent_profiles
  for select using (
    profile_id = (select auth.uid())
    or private.is_admin()
    or status = 'validated'
    or status = 'registered'
  );

commit;
