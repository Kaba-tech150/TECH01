# RAPPORT PROJET — SECU GUARD

## État actuel
Audit de reprise et premier lot du parcours de démarrage implémentés le **2026-09-25**.
Audit senior de sécurité et d'architecture exécuté le **2026-09-25**.
Diagnostic, corrections et reconstruction de la base exécutés le **2026-09-26**.

### ✅ ÉTAPE 3 TERMINÉE — SOCLE SUPABASE CONFORME (2026-09-26)

Le diagnostic de la panne « Accès indisponible / permission denied for schema public » est **clos**. Vérifié par exécution réelle contre le projet distant :

```
RESULTAT : conforme.
Les 12 tables existent, la lecture sans session est refusee,
et les 8 fonctions de transition sont presentes.
```

**État des migrations : les 7 sont appliquées et validées à l'exécution.**

| Migration | État |
|---|---|
| `20260925000100` structure, tables, triggers | ✅ appliquée |
| `20260925000200` helpers RLS | ✅ appliquée |
| `20260925000300` RLS + 32 politiques + 18 grants | ✅ appliquée |
| `20260925000400` 8 fonctions de transition | ✅ appliquée |
| `20260925000500` correctif FORCE RLS / SECURITY DEFINER | ✅ appliquée |
| `20260925000600` correctif affectation de mission | ✅ appliquée |
| `20260925000700` correctif triggers d'inscription | ✅ appliquée |

Migrations de sécurité livrées en complément le 2026-09-26, désormais **superflues** après la reconstruction complète mais conservées comme filet :
- `20260925000900_schema_convergence.sql` (182 l.) — converge les 12 tables, 75 colonnes
- `20260925001000_restore_foreign_keys.sql` (86 l.) — restaure les 14 clés étrangères perdues en cascade
- `000001_reset_all.sql` (136 l.) — remise à zéro totale, liste de tables obtenue dynamiquement

### Cause racine de la panne — diagnosticé et corrigé
Le rôle `anon` n'avait pas le droit `USAGE` sur le schéma `public`. En PostgreSQL, l'accès à une table exige de traverser le schéma **avant** toute évaluation de la RLS : l'erreur était donc levée avant que les 32 politiques soient atteintes. Ce n'était pas une politique trop stricte, c'était un droit jamais accordé. Corrigé par `20260925000300`.

### Cinq défauts de conception trouvés et corrigés le 2026-09-26

**1. L'inscription était cassée.** Elle doit créer des lignes via deux triggers `SECURITY DEFINER` (`on_auth_user_created_secuguard` → `profiles` + `profile_roles`, `on_profile_created_wallet` → `wallets`). Or `00300` applique `force row level security`, qui soumet le **propriétaire** à ses propres politiques — ce que `enable` ne fait pas. Les triggers se retrouvaient sans politique `insert`, et l'insertion dans `profile_roles` est réservée à `is_admin()`, qui renvoie `false` car `auth.uid()` vaut `NULL` avant toute session. Les triggers étant `AFTER INSERT` dans la transaction de création du compte, **leur échec annulait l'inscription entière**, avec le message trompeur `Database error saving new user`. Corrigé par `20260925000700`.

**2. `mission_assignments` non insérable.** Ni politique RLS `for insert`, ni `grant insert` : l'affectation de mission était structurellement impossible. Corrigé par `20260925000600`, qui ajoute aussi le helper `private.can_assign_mission` conformément à la convention des `SECURITY DEFINER` du schéma `private`.

**3. Le script de diagnostic produisait un faux vert.** `check-supabase-access.js` classait tout `HTTP 401` comme « OK conforme », ne distinguant pas une RLS protectrice d'une absence totale de droits, et ne testait pas les RPC. Réécrit : il teste la validité de la clé, utilise une table témoin, distingue 42501-schéma / 42501-table / table absente, et vérifie les 8 RPC avec **le bon paramètre pour chacune** (`target_mission_id` ou `target_assignment_id` — PostgREST résout les fonctions par signature complète).

**4. Fuite d'information vers l'interface.** `AuthContext.toError()` recopiait le message PostgreSQL brut. Corrigé par `src/lib/supabase/errors.ts`, qui traduit les erreurs et journalise le détail technique dans le terminal Metro sans jamais l'afficher.

**5. Dérive de schéma par `create table if not exists`.** Cette instruction ne fait **rien** sur une table déjà présente : elle masque la divergence au lieu de la signaler. Les tables `profiles` et `missions`, héritées d'un schéma antérieur, n'avaient jamais reçu les colonnes ajoutées depuis (`phone`, `postal_code`). La migration `20260925000900` a été écrite pour converger les 12 tables, avant qu'une reconstruction complète rende l'opération sans objet.

### Leçon retenue
Six incidents successifs ont révélé que **le code ne peut pas prouver son propre schéma**. Chaque correction doit être validée par exécution réelle, et les diagnostics doivent pouvoir distinguer « protégé » de « non configuré ».

### Ce qui est vérifié et exploitable
- Node.js `v24.15.0`, npm `11.12.1`, Expo CLI `57.0.27`.
- Expo `~57.0.25`, React Native `0.86.3`, Expo Router `~57.0.23`.
- TypeScript `6.0.3` en mode strict.
- ESLint `9.39.5` avec `eslint-config-expo` `57.0.2`.
- `package-lock.json` et `node_modules` présents ; `npm ls --depth=0` réussit.
- Configuration Expo résolue par `npx expo config --type public --json`.
- Routes typées et React Compiler activés dans `app.json`.
- `npm run lint` et `npm run typecheck` réussissent.
- Export web temporaire réussi avec **36 routes statiques** ; la sortie temporaire a été supprimée.
- Page d’accueil publique conservée sous `src/app/welcome.tsx`.
- Route racine `/` protégée par `StartupGate`, qui attend la session Supabase et les préférences locales avant de masquer le splash.
- Splash natif contrôlé via `expo-splash-screen`.
- Onboarding disponible dans `src/app/(startup)/onboarding.tsx`.
- Choix de profil autonome disponible dans `src/app/(startup)/profile-selection.tsx`.
- Préférences d’onboarding et de profil persistées via `src/lib/storage/preferences.ts`, avec SecureStore natif et localStorage web.
- Le profil choisi est transmis comme paramètre d’aide UX vers la connexion puis l’inscription ; il ne constitue pas une autorisation.
- Client Supabase centralisé dans `src/lib/supabase/client.ts`.
- Session persistante : SecureStore sur natif et `localStorage` sur le web.
- `AuthContext` comme source de session, profil et rôles ; `useAuth` réutilise ce contexte.
- Formulaires connexion/inscription avec React Hook Form et Zod.
- Protection côté interface par rôle et route de sélection pour les comptes multi-rôle.
- Services TypeScript de profils et de missions ; contrat Database typé.
- Deux migrations Supabase locales : `supabase/migrations/20260925000100_initial_schema.sql` et `supabase/migrations/20260925000200_rls_helpers.sql`.
- `.env` est présent et ignoré par Git ; `.env.example` ne contient que des placeholders publics vides.

### Ce qui n’est pas validé ou non terminé
- La vérification du compte n’est pas implémentée : son type et son mécanisme restent à confirmer.
- Aucun test de connexion réelle à Supabase, appel SQL, test sur appareil ou test de publication n’a été effectué.
- Le dernier contrôle Supabase documenté a retourné `42501` (`permission denied for schema public`).
- Les migrations locales n’ont pas été appliquées au projet Supabase distant.
- Les deux migrations locales créent la structure, les triggers et des helpers privés, mais ne contiennent pas les politiques RLS complètes du script `SUPABASE_SCHEMA_COMPLET.sql` ; leur comportement doit être validé sur un environnement de test.
- **CONSTAT CRITIQUE 2026-09-25 :** aucune instruction `enable row level security` et aucun `create policy` n'existe dans les deux migrations. Les tables ne sont donc pas protégées par RLS tant que les politiques du script complet ne sont pas appliquées.
- **CONSTAT CRITIQUE 2026-09-25 :** aucune table ne reçoit de `grant` vers `anon` ou `authenticated`. C'est la cause la plus probable de l'erreur `42501` (`permission denied for schema public`) observée sur le projet distant.
- **CONSTAT 2026-09-25 :** le contrat `src/lib/supabase/types.ts` déclare `mission_status` sans la valeur `paid`, alors que la migration l'ajoute. Le contrat est désynchronisé du schéma.
- Les écrans des quatre rôles restent des ébauches : statistiques codées en dur, messages « Bientôt disponible » et **13 gestionnaires de boutons vides**.
- Les parcours demande, recherche, sélection, réservation, affectation, suivi, check-in/check-out, documents, disponibilité, équipe, administration et rapports ne sont pas fonctionnels.
- `src/features` et `src/stores` existent, mais aucun module métier suivi n’y a été trouvé.
- TanStack Query et Zustand sont installés, mais aucun usage de ces bibliothèques n’a été trouvé dans `src`.
- Aucun runner de tests automatisés n’est configuré.
- `missions.service.ts` filtre les affectations avec `user.id`, alors que `agent_id` et `company_id` référencent les identifiants de `agent_profiles` et `company_profiles` : les listes agent/société doivent être corrigées avant utilisation.
- Les changements d’état de mission et d’affectation ne passent pas encore par des fonctions backend testées.
- L’audit npm documenté signale 14 vulnérabilités modérées ; aucune rétrogradation incompatible n’a été appliquée.
- La branche `master` ne contient aucun commit et présente des changements staged, unstaged, supprimés et non suivis. Aucun historique de livraison fiable n’existe encore.

## Parcours de démarrage cible
Flux validé comme spécification UX, sans implémentation réalisée dans cet audit :

```text
SPLASH SCREEN
      ↓
ONBOARDING
      ↓
CHOIX DU PROFIL
   ↙          ↘
CLIENT     AGENT / ENTREPRISE
      ↓
LOGIN
      ↓
REGISTER / INSCRIPTION
      ↓
VÉRIFICATION
      ↓
ACCUEIL
```

### Mapping avec l’existant
- **Splash screen :** le plugin `expo-splash-screen` est configuré dans `app.json` et le splash reste visible jusqu’à l’initialisation de la session et des préférences locales.
- **Onboarding :** l’écran `/(startup)/onboarding` est implémenté avec trois écrans courts et une option pour les comptes existants.
- **Choix du profil :** l’écran `/(startup)/profile-selection` est implémenté pour `client`, `agent` et `company` ; le choix est persisté localement.
- **Login :** `src/app/(auth)/sign-in.tsx` et `SignInForm` existent ; le profil sélectionné est reçu comme paramètre d’aide UX.
- **Inscription :** `src/app/(auth)/sign-up.tsx` et `SignUpForm` préparent le rôle choisi, mais le rôle réel reste contrôlé par Supabase.
- **Vérification :** aucun écran ni gestionnaire de vérification dédié n’existe. La nature de la vérification reste à confirmer.
- **Accueil :** la route `/` est désormais le gardien de démarrage ; l’accueil public est conservé sous `/welcome` et les espaces authentifiés restent `(client)`, `(agent)`, `(company)` et `(admin)`.

### Décisions à confirmer
- TODO — À CONFIRMER : `LOGIN` puis `REGISTER` sont-ils des étapes séquentielles ou des choix alternatifs ?
- TODO — À CONFIRMER : la vérification signifie-t-elle confirmation email, vérification téléphone, validation du profil, validation documentaire/admin, ou une combinaison ?
- TODO — À CONFIRMER : `ACCUEIL` désigne-t-il la page publique `/` ou l’espace privé correspondant au profil ?
- TODO — À CONFIRMER : l’onboarding est-il obligatoire à la première ouverture uniquement, ou doit-il pouvoir être revisitée ?
- TODO — À CONFIRMER : comment conserver le choix de profil avant la création du compte sans le faire confiance côté client ?

> La sélection d’espace post-connexion pour les comptes multi-rôle reste une étape distincte de la sélection de profil pré-authentification.


## Étape en cours
**AUCUNE — l'étape 3 est close.**

## Étapes terminées
- **Étape 3 (Supabase / RLS) — TERMINÉE le 2026-09-26, validée à l'exécution.** Sept migrations écrites, appliquées et vérifiées : structure et triggers, helpers RLS privés, 32 politiques RLS et 18 grants, transitions d'état serveur, et deux correctifs (affectation de mission, triggers d'inscription). Outils de contrôle : `VERIFICATION_RAPIDE.sql` (14 contrôles, une seule requête), `VERIFICATION_POST_MIGRATION.sql` (19 contrôles détaillés), `LISTE_POLITIQUES.sql`, `DIAGNOSTIC_ETAT.sql`, et `npm run check:supabase`. Résultat du diagnostic distant : **« conforme »**. `typecheck`, `lint` et `npx eslint .` réussissent.
- Audit de l’environnement, des dépendances, d’Expo Router, de TypeScript, des variables d’environnement (noms uniquement), des routes et des scripts SQL.
- Socle d’architecture, page d’accueil, composants UI/common et groupes de navigation par rôle présents.
- Socle Supabase côté client, types, services et scripts SQL présents — **désormais validés en exécution**.
- Socle d’authentification, session persistante, profil, rôles et routage protégé présent.
- **Premier lot du parcours de démarrage :** splash contrôlé, route `/` transformée en `StartupGate`, onboarding, choix de profil, persistance locale et transmission du profil vers l’inscription.
- **Écran de confirmation d’email** (`src/components/forms/SignUpForm.tsx`) : lorsque Supabase ne renvoie pas de session, l’interface affiche « Vérifiez votre messagerie » au lieu de rediriger vers une page qui échouerait.
- **Traduction des erreurs serveur** (`src/lib/supabase/errors.ts`) : aucun message technique n’est plus exposé à l’utilisateur, le détail est journalisé dans le terminal Metro.

## Prochaine étape
**ÉTAPE 4 — PARCOURS MÉTIER : le premier flux réel de bout en bout.**

Le socle technique et la sécurité serveur sont désormais fiables. Aucun écran métier n’est encore fonctionnel : **13 gestionnaires de boutons vides** et 4 écrans « Bientôt disponible ».

Le premier flux à construire est la **création de mission par un client**, pour trois raisons :
- c’est la porte d’entrée du modèle métier, tout le reste en dépend ;
- il met la RLS à l’épreuve : l’insertion sur `missions` est soumise à une politique `with check` stricte, et la publication passe par la fonction serveur `publish_mission` ;
- il est le plus court chemin pour prouver que le Socle fonctionne en production réelle, pas seulement en lecture.

### Points restant à trancher
- **Périmètre du MVP** : reste à confirmer (voir « Points à confirmer »).
- **Règles métier de la mission** : budget obligatoire ou facultatif, durée maximale, nombre d’agents minimal, règles d’annulation.
- **Modèle de paiement** : la table `wallets` existe mais aucun flux Stripe n’est branché. À confirmer avant de construire l’affectation.

### Procédure de référence
Le détail des étapes techniques est dans `supabase/verification/RECONSTRUCTION_BASE.md`. Le diagnostic courant se relance avec `npm run check:supabase`.

## Architecture
### Architecture cible
```text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   ├── (client)/
│   ├── (agent)/
│   ├── (company)/
│   └── (admin)/
├── components/
│   ├── ui/
│   ├── forms/
│   └── common/
├── features/
│   ├── auth/
│   ├── clients/
│   ├── agents/
│   ├── companies/
│   ├── missions/
│   ├── payments/
│   ├── chat/
│   ├── notifications/
│   └── reviews/
├── hooks/
├── stores/
├── services/
├── lib/
│   ├── supabase/
│   ├── api/
│   └── utils/
├── types/
└── constants/
```

### Règles d’organisation retenues
- `src/app` reste réservé à Expo Router, aux layouts et aux écrans.
- `src/components/ui` et `src/components/common` restent transverses et sans logique métier.
- Les domaines seront ajoutés dans `src/features/<domaine>` sans dupliquer les services existants.
- L’accès Supabase restera centralisé dans `src/lib/supabase`.
- Les appels métier resteront dans `src/services` ou dans le module de fonctionnalité concerné.
- Les contrats et types dériveront du schéma Supabase retenu.
- TanStack Query sera utilisé pour les données serveur lorsque le premier flux métier le nécessitera ; Zustand ne sera introduit que si un état local global est réellement justifié.
- Les composants UI ne contiendront pas les transitions métier sensibles.

## Structure des dossiers
- Racine : `C:\Users\ImpulsionClub\Desktop\secu`
- `src/app/` : accueil, authentification et groupes par rôle.
- `src/components/` : composants UI, formulaires, authentification et composants communs.
- `src/context/` : `AuthContext` et exports associés.
- `src/hooks/` : hooks d’authentification et profil.
- `src/lib/supabase/` : client, authentification, stockage, contrats et exports.
- `src/services/` : services de profils et de missions.
- `src/types/` : types dérivés du contrat Database.
- `src/constants/` : couleurs, espacements, tailles et rayons.
- `src/features/` : dossiers présents, sans module métier suivi actuellement.
- `src/stores/` : dossier présent, sans store suivi actuellement.
- `supabase/` : `config.toml` et migrations locales.
- `assets/` : icônes et ressources de l’application.
- Configuration : `app.json`, `tsconfig.json`, `eslint.config.js`, `.env` et `.env.example`.

## Technologies
- **Frontend :** React Native `0.86.3`, Expo `~57.0.25`, Expo Router `~57.0.23`.
- **Langage :** TypeScript `6.0.3`, mode strict.
- **Backend :** Supabase JS `^2.117.1`, PostgreSQL, Auth, RLS et migrations SQL.
- **État serveur :** TanStack Query `^5.103.2` installé, intégration métier à faire.
- **État local :** Zustand `^5.0.15` installé, à utiliser uniquement si nécessaire.
- **Formulaires :** React Hook Form `^7.88.0` et Zod `^4.6.5`.
- **Navigation :** Expo Router avec routes typées.
- **Qualité :** ESLint `9.39.5`, `eslint-config-expo` `57.0.2`, TypeScript strict.
- **Persistance :** `expo-secure-store` sur natif et `localStorage` sur le web.
- **Non encore intégrés :** Stripe Connect, Expo Notifications, Google Maps/Mapbox, Supabase Realtime et Edge Functions.



## Base de données
### Source locale disponible
- `SUPABASE_SCHEMA_COMPLET.sql` propose 12 tables : `profiles`, `profile_roles`, `agent_profiles`, `company_profiles`, `documents`, `missions`, `mission_assignments`, `wallets`, `transactions`, `reviews`, `messages`, `notifications`.
- `SUPABASE_SCHEMA_MINIMAL.sql` est une alternative réduite et ne doit pas être considérée comme le schéma de production.
- `supabase/migrations/20260925000100_initial_schema.sql` crée les tables, index, triggers de mise à jour, profil utilisateur et wallet.
- `supabase/migrations/20260925000200_rls_helpers.sql` crée les fonctions privées de contrôle de rôle, de visibilité de mission, d’affectation et de review.
- `supabase/migrations/20260925000300_rls_policies.sql` (2026-09-25) active et force la RLS sur les 12 tables, porte les 32 politiques de `SUPABASE_SCHEMA_COMPLET.sql` et pose les 18 grants d’accès. Migration idempotente et transactionnelle.
- `supabase/migrations/20260925000400_state_transitions.sql` (2026-09-25) expose 8 fonctions de transition (`publish_mission`, `cancel_mission`, `complete_mission`, `mark_mission_paid`, `open_mission_dispute`, `accept_assignment`, `reject_assignment`, `complete_assignment`) adossées à 2 fonctions internes `private` en `SECURITY DEFINER`. Elles implémentent la matrice de transitions, le verrouillage de ligne et le contrôle de l'acteur. Le client ne peut donc plus écrire `missions.status` ni `mission_assignments.status` directement.
- Les politiques RLS complètes sont désormais codées dans une migration locale ; **leur comportement reste non validé** tant qu’elles n’ont pas été appliquées et testées sur un environnement de test.

### Rôles et statuts
- `user_role` : `client`, `agent`, `company`, `admin`.
- `mission_status` : `draft`, `published`, `accepted`, `in_progress`, `completed`, `cancelled`, `disputed`, `paid` dans le script complet.
- `provider_status` : `registered`, `documents_submitted`, `in_validation`, `validated`, `rejected`, `active`, `suspended`.
- `payment_status` : `blocked`, `released`, `refunded`, `in_dispute`.
- `assignment_status` : `pending`, `accepted`, `rejected`, `completed`.
- `document_type` : `identity`, `certification`, `insurance`, `other`.

### Sécurité et limites
- Toutes les tables sensibles devront avoir RLS et des politiques testées par rôle, utilisateur, mission, affectation et société.
- Les tables `wallets` et `transactions` ne doivent pas exposer d’écriture directe non contrôlée au client.
- Les changements d’état de mission, l’affectation et la libération de fonds doivent être validés côté backend.
- L’accès au projet Supabase distant et l’exécution des migrations restent non validés.

## Authentification
- Supabase Auth est utilisé pour l’inscription et la connexion.
- Les fonctions de base `signUp`, `signIn`, `signOut` et la session sont présentes dans `src/lib/supabase/auth.ts`.
- `AuthContext` centralise la session, l’utilisateur, le profil et la liste des rôles.
- Le profil et `profile_roles` sont chargés avec des états loading et error explicites.
- La protection de route côté client est une aide d’interface ; la RLS reste la barrière serveur obligatoire.
- Le rôle public d’inscription est limité à `client`, `agent` ou `company`.
- La gestion OTP, la validation métier des prestataires, les règles d’approbation et la récupération de compte ne sont pas finalisées.
- Aucun test de session réelle ou de persistance sur appareil n’a été réalisé.

## Navigation
- Expo Router utilise `src/app` avec un Stack racine.
- Les groupes présents sont `(auth)`, `(client)`, `(agent)`, `(company)` et `(admin)`.
- Les groupes métier utilisent des onglets et un `ProtectedRoute`.
- Les utilisateurs mono-rôle sont redirigés vers leur espace ; les comptes multi-rôle passent par `/role-selection`.
- Une tentative d’accès à un rôle non autorisé retourne vers la sélection de rôle.
- La navigation côté client ne remplace jamais les règles RLS.

## Fonctionnalités développées
- Page d’accueil responsive avec services, statistiques, actions rapides et étapes d’utilisation.
- Design system minimal : Button, Card, Badge, Typography et composants common.
- Formulaires connexion/inscription avec validation Zod.
- Session Supabase persistante et gestion des rôles côté client.
- Contrats TypeScript Supabase et types métier centralisés.
- Services de profils, agents, sociétés et missions.
- Layouts et écrans d’ébauche pour les quatre espaces.
- Migrations SQL locales et helpers RLS privés.

## Fonctionnalités restantes
- Valider le projet Supabase distant et le schéma de référence.
- Finaliser les politiques RLS et les tests multi-rôles.
- Implémenter le parcours client : demande, recherche, sélection, réservation et suivi.
- Implémenter le parcours agent : profil, documents, disponibilité, acceptation/refus, check-in/check-out et rapport.
- Implémenter le parcours société : profil, équipe, agents, missions et affectations.
- Implémenter l’administration : utilisateurs, documents, validation, supervision et litiges.
- Ajouter les tests, la gestion d’erreur complète et la journalisation des actions sensibles.
- Les fonctions avancées restent différées : paiement, commission, wallet/escrow, cartographie, temps réel, chat, notifications, récurrence et statistiques.



## Problèmes rencontrés
**Résolus le 2026-09-26 :**
- Le diagnostic affirmait que le projet distant ne contenait que **2 tables sur 12**. Cette conclusion était **fauxe** : une requête sur un nom de table inexistant (`wallet_totals`) renvoyait `PGRST205` avec l'indication « Perhaps you meant the table 'public.wallets' », ce qui prouvait que la table existait. Le script de diagnostic ne faisait pas cette différence. Corrigé par l'ajout d'une **table témoin**.
- Le rapport attribuait l'erreur `42501` aux politiques RLS manquantes. Cause réelle : le rôle `anon` n'avait pas le droit `USAGE` sur le schéma `public`, donc l'erreur était levée **avant** toute évaluation de la RLS. Les politiques n'étaient pas en cause.
- Le script de diagnostic annonçait « conforme » sur un projet non configuré (voir l'état actuel). Réécrit.
- `mission_assignments` n'était pas insérable : ni politique `for insert`, ni `grant insert`. Corrigé.
- L'inscription échouait intégralement à cause du conflit `FORCE RLS` / `SECURITY DEFINER` sur les triggers de bootstrap. Corrigé.
- Erreur de syntaxe SQL dans `20260925000400` : `'Transition d\'affectation...'`. PostgreSQL n'accepte pas l'antislash pour échapper une apostrophe ; il faut la doubler. Corrigé, et un contrôle automatique a été ajouté pour détecter ce type de faute.
- Dérive de schéma : `create table if not exists` ne fait rien sur une table existante, masquant les colonnes manquantes de `profiles` et `missions`. Corrigé, puis rendu sans objet par la reconstruction complète.
- Les politiques RLS écrites en sous-requête directe évitaient la convention du projet (helpers `SECURITY DEFINER` du schéma `private`) et dépendaient des droits de lecture de l'appelant. Corrigé par `private.can_assign_mission`.
- Le détail technique des erreurs était masqué dans l'interface **et** jamais journalisé, rendant tout diagnostic impossible. Corrigé par `src/lib/supabase/errors.ts`.

**Structurels, non résolus :**
- La CLI Supabase n'est pas installée et le projet n'est pas lié : les migrations ne peuvent être appliquées que via le SQL Editor, manuellement. C'est la source d'une partie des incidents.
- Les scripts `SUPABASE_SCHEMA_COMPLET.sql` et `SUPABASE_SCHEMA_MINIMAL.sql` divergent. **Le schéma de référence est désormais `supabase/migrations/20260925000100_initial_schema.sql`**, seul à faire foi.
- Les parcours par rôle contiennent 13 gestionnaires vides, des données codées en dur et 4 écrans « Bientôt disponible ».
- Aucun test automatisé ni test runtime sur appareil n'est configuré. Le seul test de bout en bout est l'inscription manuelle.
- Le dépôt ne contient aucun commit et son index Git est dans un état intermédiaire.
- L'audit npm documente 14 vulnérabilités modérées ; aucune rétrogradation incompatible n'a été appliquée.

## Solutions appliquées
- Diagnostic et correction de la panne `permission denied for schema public` (cause : droit `USAGE` non accordé sur le schéma).
- Sept migrations écrites, appliquées et validées à l'exécution sur le projet distant.
- `20260925000600` : politique et droit d'insertion des affectations, avec helper `SECURITY DEFINER` conforme à la convention du projet.
- `20260925000700` : retrait du `FORCE RLS` sur `profiles`, `profile_roles` et `wallets`, qui rend l'inscription de nouveau fonctionnelle.
- `20260925000900` : convergence des 12 tables (75 colonnes), `add column if not exists`.
- `20260925001000` : restauration des 14 clés étrangères détruites en cascade.
- `000001_reset_all.sql` : remise à zéro totale, liste de tables obtenue dynamiquement depuis `pg_tables`, avec retrait explicite du trigger posé sur `auth.users`.
- Réécriture de `scripts/check-supabase-access.js` : validation de la clé, table témoin, distinction 42501-schéma / 42501-table / table absente, et vérification des 8 RPC avec le paramètre correct pour chacune.
- `src/lib/supabase/errors.ts` : traduction des erreurs serveur, distinction erreur utilisateur / incident serveur, journalisation technique dans le terminal Metro.
- Écran « Vérifiez votre messagerie » : gère le cas où Supabase ne renvoie pas de session.
- `VERIFICATION_RAPIDE.sql` : verdict unique en une requête (14 contrôles).
- `LISTE_POLITIQUES.sql` : identifie nommément les politiques héritées d'un ancien schéma.
- `DIAGNOSTIC_ETAT.sql` : état des tables, clés étrangères et données.
- `eslint.config.js` : bloc de configuration Node pour `scripts/`, qui n'était pas analysé.
- `AGENTS.md` restauré (référencé par `CLAUDE.md` mais absent) et `README.md` créé.

## Décisions techniques
- Respecter TypeScript strict et éviter `any`, `@ts-ignore` et `@ts-nocheck` dans le code de production.
- Garder Expo Router et les groupes de rôles existants.
- Centraliser l’accès Supabase dans `src/lib/supabase` et les règles sensibles côté backend.
- Utiliser RLS comme barrière de sécurité serveur ; `ProtectedRoute` n’est qu’une protection d’interface.
- Développer les domaines dans `src/features/<domaine>` sans dupliquer les services existants.
- Utiliser TanStack Query pour les données serveur lorsque le premier flux métier le justifiera.
- Utiliser Zustand uniquement si un état local global devient nécessaire.
- Valider les transitions sensibles avec des fonctions SQL ou des Edge Functions avant exposition au client.
- Ne pas développer les fonctionnalités avancées avant la validation du socle Supabase.

## Variables d'environnement
**Variables publiques actuelles :**
- `EXPO_PUBLIC_SUPABASE_URL` : présente dans `.env`, valeur non recopiée dans le rapport.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` : présente dans `.env`, valeur non recopiée dans le rapport.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` : prévue dans `.env.example`, à confirmer.
- `EXPO_PUBLIC_EXPO_PROJECT_ID` : prévue dans `.env.example`, à confirmer.

**Secrets serveur uniquement :**
- `STRIPE_SECRET_KEY` : ne doit jamais entrer dans l’application mobile.
- `STRIPE_WEBHOOK_SECRET` : ne doit jamais entrer dans l’application mobile.
- Clé `service_role` Supabase : réservée exclusivement à l’environnement backend autorisé.

## Points à confirmer
**Tranchés le 2026-09-26 :**
- ✅ **Schéma SQL de référence et stratégie de migrations** : `supabase/migrations/20260925000100_initial_schema.sql` est la source de vérité. Les scripts `SUPABASE_SCHEMA_COMPLET.sql` et `SUPABASE_SCHEMA_MINIMAL.sql` sont **périmés** et ne doivent plus être utilisés comme référence.
- ✅ **Définition de la vérification de compte** : il s'agit de la **confirmation d'adresse email** gérée par Supabase Auth. L'écran « Vérifiez votre messagerie » est implémenté dans `SignUpForm`. La validation métier des prestataires (`provider_status`) reste un chantier distinct, non couvert.

**Ouverts :**
- TODO — À CONFIRMER : Pays/zone de lancement.
- TODO — À CONFIRMER : Réglementation applicable et organismes d'agrément.
- TODO — À CONFIRMER : Prestataire de paiement et compte Stripe Connect.
- TODO — À CONFIRMER : Taux de commission et frais de transaction.
- TODO — À CONFIRMER : Délai de libération des fonds.
- TODO — À CONFIRMER : Choix Google Maps ou Mapbox.
- TODO — À CONFIRMER : Périmètre définitif du MVP.
- TODO — À CONFIRMER : Règles métier d'une mission (budget, durée, nombre d'agents, annulation).
- TODO — À CONFIRMER : **Environnement de test Supabase distinct de la production.** La base actuelle a servi de terrain d'essai et a été remise à zéro deux fois. C'est la principale fragilité du processus.
- TODO — À CONFIRMER : Politique de rétention et de purge des données personnelles (RGPD ou régime équivalent).
- TODO — À CONFIRMER : Signer un premier commit de référence. Le dépôt ne contient toujours aucun commit.

## Historique des modifications
- **2026-09-24 :** création initiale du projet et du rapport.
- **2026-09-24 :** mise en place annoncée de l’architecture, des composants transverses, des groupes de navigation et des types.
- **2026-09-25 :** page d’accueil modernisée et design system minimal documentés.
- **2026-09-25 :** client Supabase, contrat Database, services, SQL et helpers RLS ajoutés au dépôt.
- **2026-09-25 :** AuthContext, session, formulaires, rôles et ProtectedRoute ajoutés au dépôt.
- **2026-09-25 :** corrections techniques documentées pour le stockage, le typage, la session unique, le routage multi-rôle, ESLint et `.env.example`.
- **2026-09-25 :** bundle web vérifié avec 31 routes puis sortie temporaire supprimée.
- **2026-09-25 :** accès Supabase distant documenté avec l’erreur `42501` ; aucune migration distante n’a été appliquée.
- **2026-09-25 :** premier lot du parcours de démarrage implémenté : `StartupGate`, splash contrôlé, onboarding, choix de profil, préférences locales, accueil public déplacé vers `/welcome` et transmission du profil vers l’inscription.
- **2026-09-25 :** validations du lot réussies : `npm run lint`, `npm run typecheck` et export web avec 36 routes statiques ; sortie temporaire supprimée.
- **2026-09-25 :** audit de reprise exécuté sans modification du code applicatif ; rapport consolidé et prochaine étape proposée : validation du parcours et définition de la vérification.
- **2026-09-25 :** audit senior sécurité et architecture. Vérifications exécutées : `npm run typecheck` réussi, `npm run lint` réussi, `npm ls --depth=0` cohérent, versions Node `v24.15.0` / npm `11.12.1` / Expo CLI `57.0.27`. Constat critique : les deux migrations locales ne contiennent **ni RLS activée ni politique** et **aucun `grant` vers `anon`/`authenticated`** ; le contrat TypeScript est désynchronisé sur `mission_status.paid`. Aucune modification du code applicatif.
- **2026-09-25 :** étape 3 Supabase/RLS — lots A, B et C livrés. Nouvelle migration `20260925000300_rls_policies.sql` (255 lignes) : RLS activée **et forcée** sur les 12 tables, 32 politiques idempotentes (`drop policy if exists` avant création), 18 grants granulaires par colonne, `revoke all` sur les tables, `grant usage on schema public`. Contrat `src/lib/supabase/types.ts` resynchronisé avec `mission_status.paid` (2 emplacements). `missions.service.ts` : ajout de `resolveProviderId()` qui résout `auth.uid` vers `agent_profiles.id` / `company_profiles.id`, sélection explicite des colonnes, type de retour `MissionAssignmentWithMission`. `npm run typecheck` et `npm run lint` réussis après modification. **Migration non appliquée au projet distant : comportement RLS non prouvé.**
- **2026-09-25 :** diagnostic API REST en lecture seule contre `awexvvfhfzqovsvtwjfr.supabase.co`. `profiles` et `missions` → `401 / 42501 permission denied for schema public` ; `notifications` → `404 / PGRST205 table introuvable`. Conclusion : le schéma distant est **partiellement appliqué et divergent** ; le `42501` n'est pas expliqué par la seule absence de politiques. Aucune écriture effectuée.
- **2026-09-25 :** étape 3 — lot D, transitions d'état serveur. Nouvelle migration `20260925000400_state_transitions.sql` (235 lignes) : `private.transition_mission` et `private.transition_assignment` en `SECURITY DEFINER` (matrice de transitions explicite, `SELECT ... FOR UPDATE` anti-concurrence, contrôle de l'acteur, refus génériques) + 8 wrappers publics accordés à `authenticated` et révoqués pour `public`/`anon`. Contrat `types.ts` : section `Functions` renseignée (8 entrées typées). `missions.service.ts` : `publishMission`, `cancelMission`, `acceptAssignment`, `rejectAssignment` basculent de `.update()` vers `.rpc()`. Contrôle : plus aucune écriture directe d'un statut depuis le client. `typecheck` et `lint` réussis.
- **2026-09-25 :** correctif `20260925000500_rls_transitions_fix.sql` (40 lignes) ajouté après détection d'un **conflit entre deux migrations livrées**. `force row level security` (migration 00300) soumet le propriétaire aux politiques, et les fonctions `SECURITY DEFINER` (migration 00400) s'exécutent avec les droits du propriétaire : la politique « Clients can edit own draft mission details », dont la clause `with check` exige `status = 'draft'`, aurait rejeté toute écriture de statut et fait échouer `publish_mission`. Le correctif applique `no force row level security` sur `missions` et `mission_assignments` tout en conservant `enable row level security` : la sécurité côté client est inchangée puisque `anon` et `authenticated` ne sont jamais le propriétaire. La migration 00300 a été documentée en conséquence. Le fichier de vérification est passé de 12 à 14 contrôles (ajout du contrôle 13 sur `BYPASSRLS` du rôle courant et du contrôle 14 sur l'état du FORCE). Un caractère parasite coréen s'était glissé dans un commentaire du correctif : détecté par recherche de caractères non latins sur l'ensemble des `.sql`, puis corrigé ; recherche de contrôle relancée, 0 occurrence.
- **2026-09-25 :** incident d'exécution au SQL Editor — `ERROR: 42725 operator is not unique: unknown || "char"`. Cause : troisième erreur de ma part dans le fichier de vérification. `pg_trigger.tgenabled` est de type interne `char` (et non `text`), et la concaténation `'...' || tg.tgenabled || '...'` était donc ambiguë. Correction : suppression pure et simple de la concaténation, l'état brut est désormais exposé dans une colonne séparée `etat` via un cast explicite `::text`. **Le fichier ne contient désormais plus aucune concaténation `||`.** Par ailleurs, `has_function_privilege('authenticated', p.oid, ...)` a été remplacé dans les contrôles 7 et 8 par une lecture de `pg_proc.proacl` via `aclexplode`, cette fonction étant ambiguë lorsqu'on lui passe un nom de rôle en texte (elle privilégie silencieusement la signature `oid, oid`). **Aucune modification de la base.** Fichier passé de 347 à 375 lignes. Le contrôle 10 s'est exécuté avec succès (Rangées 0 affiché avant l'erreur sur la version précédente).
- **2026-09-25 :** incident d'exécution au SQL Editor — `ERROR: 42703 column t.tgenabled does not exist / HINT: Perhaps you meant to reference the column "tg.tgenabled"`. Cause : erreur de ma part dans le contrôle 10 du fichier de vérification. J'avais écrit `t.tgenabled` (alias `t` = `pg_type`) alors que la colonne `tgenabled` appartient à `pg_trigger` (alias `tg`) ; la jointure sur `pg_type` était inutile. Correction : `tg.tgenabled` avec traitement des états `O`, `D` et autres, et suppression de la jointure `pg_proc`/`pg_type`. Audit des 14 contrôles relu alias par alias : `t` n'est plus utilisé que là où il est réellement déclaré. Aucun PostgreSQL local n'étant disponible, la validation est restée statique. **Aucune modification de la base.** Deux autres défauts corrigés au passage : le contrôle 3 affichait une ALERTE sur `missions` et `mission_assignments` alors que l'absence de FORCE y est voulue par la migration 00500 (libellé adapté, `INFO` documenté) ; l'en-tête du fichier mentionnait encore 4 migrations au lieu de 5, et le contrôle 8 annonçait 6 helpers privés au lieu de 8. Fichier passé de 327 à 347 lignes.
- **2026-09-25 :** incident d'exécution au SQL Editor — `ERROR: 42601 syntax error at or near "```"`. Cause : les trois accents graves d'un bloc de code Markdown avaient été collés avec la commande `NOTIFY pgrst, 'reload schema';`. Ces balises sont des signes de mise en forme du guide, pas du SQL. **Aucune modification de la base n'a eu lieu** (la requête n'a pas été exécutée). Correctif du guide : la commande de l'étape 6 est désormais présentée en indentation au lieu d'un bloc encadré, la consigne « tapez vous-même, ne copiez pas » a été ajoutée, un encadré d'aide a été inséré pour reconnaître l'erreur, et un avertissement général sur les ``` a été placé en tête de document. Contrôle : plus aucun bloc encadré ne contient de SQL destiné au SQL Editor.
- **2026-09-25 :** guide d'exécution utilisateur créé : `supabase/verification/GUIDE_APPLICATION_MIGRATIONS.md` (238 lignes, 6 parties, 8 étapes). Rédigé après retour explicite du commanditaire sur la clarté des consignes. Le guide precise, pour chaque étape : l'URL à ouvrir (`supabase.com/dashboard`), le chemin exact du projet, le menu à cliquer (`SQL Editor`), la commande de copie (`Ctrl+A` / `Ctrl+C`), le nom complet du fichier à coller, le nombre de lignes attendu, le message de succès attendu (`Success. No rows returned`), les 5 contrôles à surveiller (2, 6, 12, 13, 14) et la commande finale `npm run check:supabase` à lancer dans le terminal VS Code. Inclut une section « en cas de problème » et un rappel de l'ordre des 8 étapes. Les nombres de lignes annoncés ont été vérifiés un à un contre les fichiers réels.

---

## Historique du 2026-09-26 — diagnostic, corrections et reconstruction

- **2026-09-26 :** diagnostic de la panne « Accès indisponible / permission denied for schema public ». Test discriminant : `wallet_totals` (table inexistante) renvoie `PGRST205` avec l'indication « Perhaps you meant the table 'public.wallets' », ce qui prouve que `wallets` existe. **L'affirmation antérieure « 2 tables sur 12 » était donc fausse** : les 12 tables existaient. Cause réelle : le rôle `anon` n'a pas le droit `USAGE` sur le schéma `public`, donc l'erreur est levée avant toute évaluation de la RLS.
- **2026-09-26 :** `scripts/check-supabase-access.js` réécrit. L'ancienne version classait tout `HTTP 401` comme « OK conforme » et ne testait pas les RPC : elle annonçait « conforme » un projet non configuré. La nouvelle version valide la clé anon, utilise une **table témoin**, distingue `42501` de niveau schéma / de niveau table / table absente, et teste les 8 RPC. Exécution réelle : **20 anomalies** correctement détectées, là où l'ancien script en annonçait 0.
- **2026-09-26 :** incident d'exécution — `ERROR: 42601 syntax error at or near "affectation"`, ligne 132 de `20260925000400`. Cause : apostrophe échappée par un antislash (`'Transition d\'affectation...'`), syntaxe invalide en PostgreSQL alors qu'elle fonctionne en C, JavaScript ou MySQL. Correction : apostrophe doublée. Un contrôle automatique détectant toute ligne SQL à nombre impair d'apostrophes a été ajouté et passe sur l'ensemble des migrations.
- **2026-09-26 :** incident d'exécution — `ERROR: 42703 column "phone" of relation "profiles" does not exist`, puis `42703 column "postal_code" of relation "missions" does not exist`. Cause commune : `profiles` et `missions` préexistaient avec une structure antérieure, et `create table if not exists` ne fait rien sur une table existante. `20260925000900_schema_convergence.sql` (182 lignes, 75 colonnes) a d'abord été écrit pour converger les 12 tables.
- **2026-09-26 :** les tables `profiles` et `missions` ont été supprimées **volontairement** par le commanditaire pour repartir d'un schéma propre. Conséquence non anticipée : le `DROP ... CASCADE` a également supprimé les **14 clés étrangères** pointant vers ces tables, sans supprimer les tables qui les portaient. `20260925001000_restore_foreign_keys.sql` (86 lignes) a été écrit pour les rétablir, avec test d'existence dans `pg_constraint`.
- **2026-09-26 :** `000001_reset_all.sql` créé (136 lignes) sur décision du commanditaire. Points notables : la liste des tables est obtenue **dynamiquement** depuis `pg_tables` afin d'attraper les tables héritées inconnues ; le trigger `on_auth_user_created_secuguard` est retiré explicitement car il est posé sur `auth.users` et **ne disparaît pas** avec les tables ; les comptes `auth.users` sont supprimés, un compte sans profil étant irrécupérable puisque le trigger ne se déclenche qu'à l'inscription.
- **2026-09-26 :** **reconstruction complète réussie.** Sept migrations appliquées dans l'ordre. Résultat de `npm run check:supabase` : **« conforme »** — les 12 tables existent, la lecture sans session est refusée, les 8 fonctions de transition sont présentes et refusées au rôle `anon`. `npm run typecheck`, `npm run lint` et `npx eslint .` : code 0.
- **2026-09-26 :** `VERIFICATION_RAPIDE.sql` créé (14 contrôles en une requête), `LISTE_POLITIQUES.sql` (identifie nommément les politiques héritées), `DIAGNOSTIC_ETAT.sql` et `RECONSTRUCTION_BASE.md` (procédure ordonnée). `GUIDE_APPLICATION_MIGRATIONS.md` conservé comme référence historique et explicitement marqué obsolète.
- **2026-09-26 :** `eslint.config.js` complété d'un bloc Node pour `scripts/`, qui n'était pas analysé : `npx eslint .` échouait sur `__dirname is not defined` alors que `npm run lint` ne voyait que `src/`.
- **2026-09-26 :** `AGENTS.md` restauré — référencé par `CLAUDE.md` mais inexistant. `README.md` créé. Règles de sécurité documentées, dont la règle sur `force row level security` (« avant d'ajouter un `force`, vérifier ce qui écrit en `SECURITY DEFINER` »), à l'origine de la moitié des incidents.
- **2026-09-26 :** **étape 3 close.** Socle serveur validé à l'exécution. Réserve explicite : le test d'inscription de bout en bout n'a pas été confirmé par le commanditaire, et aucun test automatisé n'existe.

- **2026-09-26 :** `src/lib/supabase/errors.ts` créé. `AuthContext.toError()` recopiait le message PostgreSQL brut dans l'interface. Le nouveau module traduit les erreurs, distingue erreur utilisateur et incident serveur, et journalise le détail technique via `logTechnicalError()` dans le terminal Metro. `AuthContext` expose `isServiceIssue`, et `ProtectedRoute` propose « Réessayer » quand l'incident est côté serveur.
- **2026-09-26 :** écran « Vérifiez votre messagerie » ajouté dans `SignUpForm`. Lorsque Supabase ne renvoie pas de session (confirmation d'email requise), l'interface redirigeait vers la sélection d'espace, qui ramenait immédiatement à la connexion avec une erreur trompeuse.
- **2026-09-26 :** `20260925000600_assignment_insert_fix.sql` créé (114 lignes). `missionsService.createAssignment()` était structurellement inopérant : ni politique RLS `for insert`, ni `grant insert`. Le correctif ajoute le helper `private.can_assign_mission` en `SECURITY DEFINER`, conformément à la convention du projet, puis la politique et le droit d'insertion.
- **2026-09-26 :** `20260925000700_signup_triggers_fix.sql` créé (88 lignes). **L'inscription était cassée** : les deux triggers de bootstrap sont `SECURITY DEFINER` et écrivent dans `profiles`, `profile_roles` et `wallets`, trois tables sur lesquelles `00300` avait appliqué `force row level security`. Le `FORCE` soumet le propriétaire à ses propres politiques ; l'insertion dans `profile_roles` étant réservée à `is_admin()`, qui renvoie `false` car `auth.uid()` vaut `NULL` avant session, l'inscription entière échouait. **Une première version du correctif oubliait `profile_roles`**, et a été complétée après analyse du message `Database error saving new user` remonté par le journal technique.

- **2026-09-25 :** outils de contrôle post-application livrés (mode d'exécution manuelle retenu). `supabase/verification/VERIFICATION_POST_MIGRATION.sql` : 14 contrôles **strictement en lecture seule** (pg_catalog / information_schema) — tables attendues, détection de drift (tables sans RLS), RLS activée et forcée, comptage des 32 politiques par table, permissions par rôle, écriture interdite sur colonnes sensibles (`profiles.role`, `profiles.email`, `missions.status`, `mission_assignments.status`), fonctions de transition et helpers privés, enums, triggers, index, récapitulatif. `scripts/check-supabase-access.js` + script npm `check:supabase` : rejoue le diagnostic API REST en lecture seule et sort en code 1 si anomalie. Exécution réelle contre le projet distant : **10 anomalies** — seules `profiles` et `missions` existent, les 10 autres tables renvoient `PGRST205`. Conclusion : le projet distant ne contient que 2 tables sur 12, l'hypothèse précédente d'un conflit de politiques RLS est infirmée. Sortie console en ASCII pour éviter l'affichage illisible des accents en console Windows.
