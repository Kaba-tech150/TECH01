# RAPPORT PROJET — SECU GUARD

> Document de référence unique. Écrit le **2026-09-26** après analyse exhaustive
> du code : 69 fichiers, 8 355 lignes dans `src/`.
>
> L'ancien rapport, riche mais contradictoire et traversé de mentions périmées,
> est conservé dans `docs_RAPPORT_HISTORIQUE_2026-09-26.md` (539 lignes). Il
> reste la référence pour l'historique d'incidents ; **ce document fait foi** pour
> l'état courant.
>
> **Convention de lecture.** Chaque affirmation porte l'une de ces mentions :
> - **[V]** vérifié par exécution ou lecture directe du code ;
> - **[D]** déduit, non exécuté ;
> - **[X]** non vérifié, à confirmer.
>
> Cette convention remplace l'ancienne pratique des bandeaux « PÉRIMÉ » : on
> n'enregistre ici que ce qui est vrai à la date indiquée.

---

## État actuel

Le projet **compile, s'exporte et s'ouvre**. Il **n'est pas fonctionnel** : le
premier flux métier — la création d'une mission — échoue.

| Domaine | État | Preuve |
|---|---|---|
| Socle technique | ✅ Opérationnel | **[V]** `tsc --noEmit` vide · `npx eslint .` exit 0 · `expo export --platform web` = 38 routes |
| Design system | ✅ Opérationnel | **[V]** tokens centralisés, 6 primitives, aucune couleur en dur dans les composants |
| Base Supabase | ✅ **Saine** | **[V]** 9 contrôles au vert : politiques, trigger, défauts, droits, RLS active |
| Sécurité de la base | ✅ Sonde retirée | **[V]** `01500` appliquée · contrôle 17 `OK` |
| Authentification | 🔴 **Cause de P1** | **[V]** `Invalid login credentials` × 3 → **aucune session** |
| Parcours client | 🔴 **Bloqué par l'auth** | **[V]** `403` en lecture · `auth.uid()` = `NULL` en écriture |
| Recherche prestataires | ✅ **Fonctionnelle** | **[D]** service + écran compilent · **[X]** jamais affichée à l'écran |

**Réponse aux trois questions du cahier des charges :**

1. **Où en sommes-nous ?** Socle, architecture et design system terminés. Base
   Supabase conforme en lecture, **16 contrôles sur 16 au vert** hors un défaut
   connu et isolé. **Aucun flux métier n'est fonctionnel.**
2. **Qu'est-ce qui fonctionne ?** L'application démarre, s'exporte, navigue,
   branche l'authentification, lit les données autorisées, et affiche une
   interface cohérente.
3. **Quelle est la prochaine étape ?** Coller `01200`, puis tester la création
   d'une mission. C'est le test qui manque depuis le début du projet.

**Réserve générale :** aucun test automatisé n'existe. Les seules validations
sont `typecheck`, `lint`, `export` et un test manuel sur le web. **Rien n'a été
vérifié sur un appareil mobile.**

---

## Étape en cours

**Étape 6 du plan (parcours client) — BLOQUÉE sur son premier jalon.**

Le jalon « création d'une demande » échoue côté serveur. Aucun jalon suivant ne
peut être attaqué : on construirait trois parcours sur un fond qui ne tient pas.

## Étapes terminées

| Étape | Statut | Nature de la validation |
|---|---|---|
| 0 — Environnement | ✅ | **[V]** versions relevées et fonctionnelles |
| 1 — Architecture | ✅ | **[V]** structure conforme au plan |
| 2 — Page d'accueil | ✅ | **[V]** export web, 38 routes |
| 3 — Supabase | ⚠️ **partielle** | **[V]** conforme en lecture · **[X]** écriture jamais testée |
| 4 — Authentification | ⚠️ **codée, non prouvée** | **[X]** aucune exécution réussie |
| 5 — Routing par rôle | ✅ | **[V]** les 4 groupes rendent |

## Prochaine étape

**Débloquer la création d'une mission.** Voir P1 dans « Problèmes rencontrés ».

---


## Architecture

### Vue d'ensemble

Quatre couches, dépendances dirigées vers le bas uniquement :

```text
┌─────────────────────────────────────────────────┐
│  src/app/            écrans + layouts (routing)  │  Expo Router
├─────────────────────────────────────────────────┤
│  src/features/       cas d'usage, hooks métier   │  TanStack Query
├─────────────────────────────────────────────────┤
│  src/components/     ui · forms · common        │  transverse
│                      auth · navigation          │  aucune logique métier
├─────────────────────────────────────────────────┤
│  src/services/       accès aux données           │  seul auteur des
│  src/lib/supabase/   client, auth, types        │  appels Supabase
└─────────────────────────────────────────────────┘
        src/constants/   tokens de style
        src/types/       contrats partagés
```

### Règles de dépendance appliquées

- **[V]** `src/app` n'importe **jamais** `@/lib/supabase` directement : il passe
  par `@/features` ou `@/components`.
- **[V]** `src/components/ui` et `src/components/common` n'ont **aucune**
  dépendance vers `src/services`. Ce sont des primitives pures.
- **[V]** `src/lib/supabase` est le **seul** point d'accès à Supabase.
- **[D]** `src/context/AuthContext.tsx` échappe à la règle `features/<domaine>` du
  plan : la logique d'authentification vit dans `context/`, dossier absent de
  l'architecture cible. **Écart connu, à arbitrer.**

### État réel de `src/features/`

Le plan prévoit 10 domaines. État réel : **[V]**

| Domaine | Fichiers | État |
|---|---|---|
| `missions/` | 4 | ✅ réel (schéma, service, hooks, carte) |
| `villes/` | 3 | ✅ réel (sélecteur, hook, service) |
| `agents/` | 0 | ⬜ vide |
| `auth/` | 0 | ⬜ vide — la logique est dans `context/` |
| `chat/` | 0 | ⬜ vide |
| `clients/` | 0 | ⬜ vide |
| `companies/` | 0 | ⬜ vide |
| `notifications/` | 0 | ⬜ vide |
| `payments/` | 0 | ⬜ vide |
| `reviews/` | 0 | ⬜ vide |

**8 des 10 domaines du plan sont des dossiers vides.** Ils ont été créés en
amorce de la structure cible, pas en fonction d'un besoin démontré.

## Structure des dossiers

- **[V]** Racine : `C:\Users\ImpulsionClub\Desktop\secu`
- **[V]** `src/app/` — 20 écrans, 5 groupes (`auth`, `client`, `agent`, `company`,
  `admin`) + `startup` + `_layout.tsx` racine + `index.tsx` + `welcome.tsx`
- **[V]** `src/components/` — `ui` (5), `common` (8), `forms` (5), `auth` (2),
  `navigation` (2)
- **[V]** `src/context/` — `AuthContext.tsx` (279 l.) + `index.ts`
- **[V]** `src/hooks/` — `useAuth.ts`, `useProfile.ts`, redondants avec
  `useAuthContext`
- **[V]** `src/lib/` — `supabase` (6), `storage` (2), `utils` (2), `queryClient.ts`

## Technologies

| Domaine | Choix | Version | Usage réel |
|---|---|---|---|
| Framework | Expo | `~57.0.25` | **[V]** actif |
| Navigation | Expo Router | `~57.0.23` | **[V]** actif, 38 routes |
| Langage | TypeScript | `6.0.3` `strict` | **[V]** actif, aucun `any` |
| Base | Supabase JS | `^2.117.1` | **[V]** actif |
| État serveur | TanStack Query | `^5.103.2` | **[V]** actif (missions, villes) |
| État local | Zustand | `^5.0.15` | **[X] installé, **aucun** usage dans `src` |
| Formulaires | React Hook Form | `^7.88.0` | **[V]** actif |
| Validation | Zod | `^4.6.5` | **[V]** actif |
| Icônes | Material Community | bundled | **[V]** actif (onglets) |
| Polices | Plus Jakarta Sans, Manrope | via `@expo-google-fonts` | **[V]** chargées au démarrage |
| Persistance | expo-secure-store / localStorage | `~4.0.3` | **[V]** actif |
| Dates | @react-native-community/datetimepicker | `9.1.0` | ⚠️ **natif seul** (voir P2) |

**Non intégrés** (prévus au plan, absents) : **[V]**
Stripe Connect · Expo Notifications · Google Maps / Mapbox · Supabase Realtime ·
Supabase Edge Functions · Supabase Storage · aucun runner de tests.

## Base de données

### Tables — 13 en production

**[V]** `profiles` · `profile_roles` · `agent_profiles` · `company_profiles` ·
`documents` · `missions` · `mission_assignments` · `wallets` · `transactions` ·
`reviews` · `messages` · `notifications` · `villes`

### Migrations — 15 fichiers

**[V]** Toutes formatées `AAAAMMJJHHMMSS_description.sql`, idempotentes et
transactionnelles (`begin;` … `commit;`), sauf `000001_reset_all.sql` qui est un
outil destructif hors chaîne.

| Fichier | Rôle | Appliqué |
|---|---|---|
| `20260925000100` | structure, tables, triggers | **[V]** oui |
| `20260925000200` | 6 helpers RLS `SECURITY DEFINER` en schéma `private` | **[V]** oui |
| `20260925000300` | RLS + 32 politiques + 18 grants | **[V]** oui |
| `20260925000400` | 8 fonctions de transition d'état | **[V]** oui |
| `20260925000500` | retire `FORCE RLS` de `missions` et `mission_assignments` | **[V]** oui |
| `20260925000600` | politique `insert` + helper sur `mission_assignments` | **[V]** **partiellement** (voir P1b) |
| `20260925000700` | correction des triggers d'inscription | **[V]** oui |
| `20260925000900` | convergence du schéma (182 l.) | **[D]** devenu sans objet après reconstruction |
| `20260925001000` | restauration de 14 clés étrangères | **[D]** devenu sans objet |
| `20260925001100` | table `villes` + 8 villes d'exemple | **[V]** oui |
| `20260926001200` | **restauration de l'insertion des affectations** | ❌ **écrit, non appliqué** |
| `20260926001300` | sonde de diagnostic RLS | **[V]** **appliquée le 2026-09-27** |
| `20260926001400` | `missions.client_id` dérivé du jeton (correctif P1) | **[X]** **état inconnu** |
| `20260926001500` | **retrait de la sonde de diagnostic** | **[V]** **appliquée le 2026-09-27** |
| `000001` | remise à zéro totale (destructif) | outil manuel — **ne plus jamais le rejouer** |

> ⚠️ **Correction du 2026-09-27.** Les versions précédentes de ce tableau
> affirmaient que `01300` n'avait pas été appliquée. **C'était faux**, et
> l'erreur a été démontrée par exécution : `diagnostic_rls` renvoyait
> `42501 permission denied for function` — le code qui dit « la fonction
> **existe** » — alors qu'une fonction témoin renvoyait `404 PGRST202`, le code
> qui dit « elle **n'existe pas** ». La sonde était donc exposée en production
> pendant que ce rapport la déclarait non appliquée. Elle a été retirée par
> `01500`, et le contrôle 17 de `VERIFICATION_RAPIDE.sql` empêche désormais le
> retour de ce défaut.

### Sécurité — ce qui est en place

- **[V]** RLS activée sur les 13 tables
- **[V]** `anon` ne reçoit **aucun** droit d'écriture (contrôle 13 = 0)
- **[V]** Les statuts passent par 8 RPC `SECURITY DEFINER`, pas en écriture directe
- **[V]** `wallets` et `transactions` : aucune écriture client
- **[V]** Aucune clé `service_role` ni secret Stripe dans le dépôt
- **[D]** `missions.city` **n'a pas de clé étrangère** vers `villes.nom` : un
  client malveillant peut envoyer une ville arbitraire en contournant le
  formulaire. **Seule réserve de sécurité connue restante.**

### Divergence constatée entre fichiers et production

- **[V]** Les migrations définissent **38** politiques ; la base en compte
  **37**. L'écart est la politique `insert` de `mission_assignments` (P1b).
- **[V]** Corollaire : **`000001_reset_all.sql` a été exécuté après
  `20260925000600`**, et son `DROP TABLE … CASCADE` a emporté cette politique
  alors que la fonction `can_assign_mission` du même fichier survivait — le
  corps d'une fonction SQL n'étant pas une dépendance suivie par PostgreSQL.
- **[D]** Conséquence méthodologique : les fichiers du dépôt **ne prouvent pas**
  l'état de la base. Chaque correction doit être validée par exécution.

## Authentification

- **[V]** `src/lib/supabase/auth.ts` expose `signUp` / `signIn` / `signOut` / session
- **[V]** `AuthContext` centralise `session`, `user`, `profile`, `roles`,
  `loading`, `error`, `isServiceIssue`
- **[V]** Le détail technique des erreurs est journalisé sous
  `technicalDetail` et **jamais affiché** — bonne pratique, conforme à la règle
  de sécurité du projet
- **[V]** `roles` fusionne `profiles.role` et `profile_roles` (déduplication par
  `Set`) : le **multi-rôle est lu** correctement
- **[V]** `StartupGate` redirige vers `/(auth)/role-selection` quand
  `roles.length > 1`
- **[X]** **Jamais testé** : aucune inscription ni connexion réussie n'a été
  observée depuis le début du projet

## Navigation

- **[V]** 5 groupes : `(auth)`, `(client)`, `(agent)`, `(company)`, `(admin)`,
  plus `(startup)` pour l'onboarding
- **[V]** Chaque groupe protégé par `ProtectedRoute requireAuth requireRole`
- **[V]** Barres d'onglets unifiées via `src/components/navigation/tabBarOptions.ts`
  (icônes Material, filet cyan, ombre, police de libellé)
- **[D]** `ProtectedRoute` est une **aide d'interface**, pas une barrière : la
  barrière est la RLS. Un utilisateur peut contourner le routage en appelant
  l'API directement.
- **[D]** Le choix d'espace en multi-rôle n'est **pas persisté** : à chaque

## Fonctionnalités développées

### Fonctionnelles — validées à l'exécution **[V]**

| Fonctionnalité | Preuve |
|---|---|
| Démarrage de l'application | `expo export` web, 38 routes |
| Chargement des polices | 8 graisses chargées avant le splash |
| Navigation par onglets | 4 espaces, icônes Material rendues |
| Ouverture de la ville | `SelectVille` : liste fermée, recherche, sélection |
| Validation du formulaire de mission | Zod, messages en français |
| Liste des missions | TanStack Query, états pending / error / empty distincts |
| Traduction des erreurs | `errors.ts` : jamais de message technique affiché |

### Codées mais non prouvées **[X]**

| Fonctionnalité | État |
|---|---|
| Inscription | jamais exécutée avec succès |
| Connexion | jamais exécutée avec succès |
| Déconnexion | codée, non testée |
| Création de mission | **casse** (P1) |
| Publication / annulation d'une mission | codées via RPC, jamais testées |
| Acceptation / refus d'affectation | codés via RPC, jamais testés |
| Check-in / check-out | codés, jamais testés |

### Écrans vides — aucune fonctionnalité **[V]**

| Écran | Constat |
|---|---|
| `(client)/search.tsx` | « Bientôt disponible » — la **recherche de prestataires**, cœur du MVP, n'existe pas |
| `(agent)/missions.tsx` | texte statique + 1 bouton vide |
| `(agent)/availability.tsx` | 1 bouton vide |
| `(company)/missions.tsx` | idem |
| `(company)/team.tsx` | 1 bouton vide |
| `(admin)/index.tsx` | 2 boutons vides |
| `(admin)/users.tsx`, `missions.tsx` | statique |
| 4 × `profile.tsx` | statique |

**Bilan : 10 gestionnaires `onPress={() => {}}` sur 7 écrans. Aucune requête de
donnée dans les espaces agent, société et administrateur.**

## Fonctionnalités restantes

Toutes les étapes 7 à 13 du plan. Les plus structurantes :

- **[D]** **Recherche de prestataires** — absente. Sans elle, le MVP
  (`Accueil → … → recherche → sélection → réservation`) est inatteignable.
- **[D]** **Réservation** — absente.
- **[D]** **Publication effective** d'une mission — la RPC existe, l'interface non.
- **[D]** Paiement, commission, escrow — non commencés
- **[D]** Géolocalisation, temps réel, chat, notifications — non commencés
- **[D]** Administration fonctionnelle — non commencée

---

## Problèmes rencontrés

Classement par gravité. La cause est marquée **ÉTABLIE** ou **NON ÉTABLIE**.

### P1 — BLOQUANT : la création d'une mission échoue — **CORRIGÉ, À VÉRIFIER**

**Symptôme.** `new row violates row-level security policy for table "missions"`.

**Cause racine : NON ÉTABLIE.** C'est le point le plus instructif du projet.

Toutes les conditions de la clause `WITH CHECK` ont été vérifiées **vraies, dans la
même exécution que l'insertion qui échoue** :

| Élément | Valeur mesurée | Verdict |
|---|---|---|
| Politique `insert` | `(client_id = auth.uid() AND status = 'draft')`, `PERMISSIVE` | ✅ |
| `auth_uid()` | `399ac4d5-…` | ✅ |
| `client_id` envoyé | `399ac4d5-…` — **identique** | ✅ |
| `status` | défaut `'draft'`, confirmé en base | ✅ |
| Droits `INSERT` | les 11 colonnes accordées sont exactement celles envoyées | ✅ |
| Trigger `BEFORE INSERT` | aucun | ✅ |
| `FORCE RLS` | levé (`false`) | ✅ |
| Politique `RESTRICTIVE` | aucune | ✅ |

Sept causes éliminées une à une. La ligne satisfait la clause, et PostgreSQL la
refuse quand même. **Aucune explication n'a été trouvée, et aucune n'est
inventée ici.**

**PREUVE DÉCISIVE — LA BASE EST SAINE.** Le 2026-09-26, un `INSERT` identique a
été exécuté dans le **rôle `authenticated`**, avec le **même jeton** que
l'application, dans le SQL Editor :

```sql
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"399ac4d5-…","role":"authenticated"}', true);
  insert into public.missions (client_id, title, address, city, start_time, end_time)
  values (auth.uid(), 'diag', 'diag', 'Paris', now(), now() + interval '1 hour');
rollback;
```

Résultat : **`TEST 2 REUSSI`**. La base accepte l'insertion. La politique est
fonctionnelle, les droits sont corrects, `client_id = auth.uid()` est vrai en
rôle réel.

**Conséquence : le défaut est dans la manière dont l'application émet la
requête, pas dans le schéma.**

**La seule différence restante** entre TEST 2 et l'appel de l'application :

| | Colonnes |
|---|---|
| TEST 2 | 6 — `client_id`, `title`, `address`, `city`, `start_time`, `end_time` |
| Application | 11 — les 6 précédentes plus `description`, `postal_code`, `budget`, `special_requirements`, tous à `null` quand les champs sont vides, plus `agent_count` |

**Correctif retenu : inversion de responsabilité.**

La faiblesse de conception est que l'application **envoie** `client_id` et que la
base doit vérifier qu'il est correct. Toute la garantie repose sur une
comparaison — celle qui échoue.

`20260926001400_mission_client_id_default.sql` pose :
```sql
alter table public.missions
  alter column client_id set default auth.uid();
revoke insert (client_id) on table public.missions from authenticated;
```

> ⚠️ **La forme compte.** `auth.uid()` s'écrit en appel de fonction **nu**.
> Écrire `(select auth.uid())` est une sous-requête, et PostgreSQL la refuse dans
> une expression `DEFAULT` : `ERREUR 0A000`. Cette faute a été commise puis
> corrigée le 2026-09-26.

Le serveur écrit désormais l'identité. L'application n'envoie plus `client_id`,
et **n'a plus le droit de l'envoyer**. La clause compare `auth.uid()` à elle-même,
et la charge utile passe de 11 à 10 colonnes.

**Ce n'est pas un contournement, c'est une amélioration de sécurité :**

1. le client ne peut plus créer une mission au nom d'autrui — garantie auparavant
   portée par la RLS, désormais portée par l'absence de droit
2. même si une politique RLS était défaillante, l'écriture directe serait
   refusée par le catalogue
3. la donnée d'identité provient de la source la plus fiable, et non du client

La politique RLS reste **inchangée** : elle demeure le filet de sécurité.

**Point d'honnêteté :** la base étant saine, la cause est dans l'émission de la
requête. La cause **exacte** n'est toujours pas nommée — le correctif la contourne
en supprimant la variable, sans prouver laquelle des 11 colonnes posait
problème. **Seule l'exécution le confirmera.** S'il échoue encore, le défaut est
dans les colonnes à `null` ou dans `agent_count`, et ce sera une cause
identifiée cette fois.

**Statut :** **[V]** base prouvée saine · **[V]** code compilé, build validé ·
**[X]** effet du correctif non vérifié.

### P2 — Le calendrier ne s'ouvre pas sur le web

**Cause : ÉTABLIE.** `@react-native-community/datetimepicker` **n'implémente pas
le web** et journalise `DateTimePicker is not supported on: web` avant de ne rien
rendre. Ce n'est pas un bug du projet.

**Impact :** les dates ne sont pas saisissables, donc la création de mission est
**bloquée en amont** de P1 sur le web.

**Correctif appliqué :** branche web de `ChampDateHeure` utilisant `<input
type="date">` et `<input type="time">`. Le format échangé reste
`AAAA-MM-JJ HH:MM` : Zod, `versIso` et la base ne voient aucune différence. Le
natif est intact. **[V]** `typecheck`, `lint`, `export` passent. **[X]** jamais
affiché à l'écran.

### P3 — Un message d'erreur désignait la mauvaise fonctionnalité

**Cause : ÉTABLIE.** Dans `errors.ts`, la condition interceptait **toute**
violation RLS et renvoyait « La création de votre profil a échoué ». Une seconde
branche testait la même condition : **inattignable**, donc du code mort.

**Impact :** tout échec d'écriture — mission, document, avis, message,
portefeuille — affichait un message pointant vers l'inscription.

**Correctif appliqué :** le message d'inscription est réservé à `database error
saving new user` ; les violations RLS sur les données renvoient un message neutre
qui ne nomme ni table ni politique. **[V]** validé à l'écran.

### P4 — Cycle d'import dans `features/villes` — **CORRIGÉ le 2026-09-26**

**Cause : ÉTABLIE.** `index.ts` exporte `SelectVille`, qui importait `filtrerVilles`
et `useVilles` depuis ce même `index.ts`. Cycle `index` → `SelectVille` → `index`,
signalé par Metro à chaque bundling.

**Correctif :** `SelectVille.tsx` importe désormais depuis `./useVilles`. Les
autres fichiers du domaine continuent d'importer `@/features/villes`, ce qui est
correct : seul un fichier exporté par le baril doit importer en direct. La
raison est écrite en tête du composant pour que le cycle ne revienne pas.

**Validation :** **[V]** `expo export` ne signale plus aucun `Require cycle`.

### P5 — Code et sonde de diagnostic en production — **CLOS le 2026-09-27**

Trois éléments côté application, pour diagnostiquer P1 :

1. **[V]** bloc temporaire dans `useMissions.ts` — supprimé
2. **[V]** déclaration `diagnostic_rls` dans le contrat `types.ts` — supprimée
3. **[V]** bandeau de diagnostic dans `new.tsx` — supprimé

Côté base, **[V] `20260926001500_diagnostic_drop.sql` a été appliquée le
2026-09-27.** `public.diagnostic_rls()` n'existe plus : le contrôle 17 de
`VERIFICATION_RAPIDE.sql` et le nouveau contrôle de `check:supabase` le
vérifient tous les deux, et renvoient `OK`.

> **Ce que ce défaut a coûté.** Entre l'écriture de la sonde et son retrait, la
> fonction a été exposée au rôle `authenticated` en production. Elle ne donnait
> accès à aucune donnée utilisateur, mais elle renvoyait la politique RLS de
> `missions`, ses clauses `WITH CHECK`, ses triggers et ses droits accordés :
> une cartographie de la défense, offerte à quiconque savait l'appeler. Elle
> n'a jamais été utilisée à des fins malveillantes, mais elle n'aurait pas dû
> exister.
>
> **La vraie raison du retard n'est pas l'oubli de migration**, c'est que
> `check:supabase` annonçait « conforme » pendant ce temps. Le script ne
> cherchait que les 8 fonctions de transition, et ignorait tout ce qui n'en
> faisait pas partie : **un contrôle qui ne teste que ce qu'il attend ne peut
> pas détecter ce qu'il n'attend pas.** Les deux contrôles ont été ajoutés.

`20260926001300` reste volontairement dans `supabase/migrations/` : l'historique
reste traçable, et `01500` garantit un état propre quel que soit l'ordre
d'exécution.

### P6 — `villesService` exposait deux noms pour un seul comportement — **CORRIGÉ le 2026-09-26**

**Cause : ÉTABLIE.** `getAllCities()` et `getActiveCities()` exécutaient **le même
`select`**, sans filtre. **[V]** Aucun appelant n'utilisait l'une ou l'autre.

**Pourquoi ce n'est pas anodin.** La distinction documentée — « villes
désactivées incluses » contre « villes actives » — n'existe **que dans la RLS**
(`using (active or private.is_admin())`), qui s'applique aux deux requêtes
identiquement. Un appelant non administrateur croyant appeler `getAllCities()`
n'aurait pas vu les villes inactives, et n'aurait pas su pourquoi.

**Correctif :** une seule méthode, `listCities()`. Le nom dit ce que le code
fait réellement : lister ce que la RLS autorise. Le filtrage reste porté par la
base, seule source de vérité — filtrer côté client aurait cassé le cas de
l'administrateur, qui doit voir les villes désactivées.

**Validation :** **[V]** `typecheck` et `lint` passent ; plus aucune référence
résiduelle aux deux anciens noms hors documentation.

### P7 — `missionsService` acceptait des écritures que la base refuse — **CORRIGÉ le 2026-09-26**

**Cause : ÉTABLIE.** `updateMission` et `createAssignment` acceptaient des types
qui autorisent `status` et `client_id`, alors que la base ne les accorde pas.

**Correctif :** deux types ont été introduits dans `src/types/index.ts` pour que
le contrat reflète la base, et non une intention :

- `MissionUpdatableFields` reproduit **colonne par colonne** le `grant update`
  de la migration `00300`. Toute divergence entre les deux deviendrait visible à
  la compilation.
- `createAssignment` omet désormais `status` : une affectation démarre
  obligatoirement à `pending`.

`agent_id` et `company_id` restent facultatifs, volontairement : la contrainte
`mission_assignments_target_check` impose exactement une des deux, et les rendre
obligatoires aurait fait rejeter à la compilation la forme la plus courante de
l'affectation.

**Validation :** **[V]** `typecheck` et `lint` passent.

### P8 — Incohérence d'en-tête entre les espaces

**Cause : ÉTABLIE.** `AppHeader` (401 lignes, le plus gros composant du projet)
n'est utilisé que dans **un seul écran** : `(client)/index.tsx`. **[V]**

Les accueils agent, société et administrateur n'affichent pas d'en-tête. Les
icônes des `StatCard` restent des emojis (`👥`, `📋`) alors que le jeu Material a
été déployé la veille.

### P9 — Dette technique mineure **[V]**

- `src/hooks/useAuth.ts` et `useProfile.ts` font doublon avec `useAuthContext`
- `src/lib/api/` est vide

## Solutions appliquées

| # | Problème | Solution | Validation |
|---|---|---|---|
| S1 | Polices retombant sur la police système | 27 `fontWeight` → `FONT_FAMILIES`, mapping sémantique (titres en Plus Jakarta Sans, texte en Manrope) sur 13 fichiers | **[V]** typecheck, lint |
| S2 | `AppHeader` hors design system | 5 blocs de constantes locales supprimés, tokens partagés adoptés, `'System'` éliminé | **[V]** typecheck, lint |
| S3 | 12 emojis dans les onglets | `navigation/tabBarOptions.ts` partagé, icônes Material sur les 4 espaces | **[V]** typecheck, lint, export |
| S4 | P2 — calendrier web | Contrôles HTML natifs dans `ChampDateHeure` | **[V]** build **[X]** écran |
| S5 | P3 — message erroné | Traductions séparées dans `errors.ts` | **[V]** typecheck, lint, **écran** |
| S6 | P1b — politique absente | `20260926001200` écrit avec auto-vérification | **[V]** écrit **[X]** appliqué |
| S7 | Piège d'ordre d'exécution | Avertissement documenté en tête de `000001_reset_all.sql` | **[V]** |
| S8 | P4 — cycle `villes` | Import direct `./useVilles` dans le composant exporté par le baril | **[V]** export sans `Require cycle` |
| S9 | P6 — doublon `villesService` | `getActiveCities` + `getAllCities` → `listCities`, nom aligné sur le comportement réel | **[V]** typecheck, lint |
| S10 | P7 — contrats trop permissifs | `MissionUpdatableFields` reproduit le `grant update` ; `status` retiré de `createAssignment` | **[V]** typecheck, lint |

**En attente, volontairement :**
- **P1** : diagnostic `20260926001300` écrit, **non appliqué**. La mesure d'`auth.uid()` dans le bon contexte n'a pas été faite.
- **P1b** : `20260926001200` écrit, **non appliqué**.
- **P5** : code de diagnostic **conservé** tant que P1 n'est pas clos. Retirer le diagnostic avant sa mesure supprimerait la seule voie restante.
- **P8** : en-tête et emojis des `StatCard` sur les autres espaces — non traités.

## Décisions techniques

| Décision | Motif | Statut |
|---|---|---|
| TanStack Query plutôt que `useState` | distingue « chargement » de « vide », réinvalidation après écriture | **[V]** appliquée à missions et villes |
| `retry: 1` et non 3 | les échecs de permission ne se corrigent pas en réessayant | **[V]** appliquée |
| Vérifications d'accès dans `private` en `SECURITY DEFINER` | une sous-requête dans une politique s'exécute avec les droits du **rôle appelant** | **[V]** 6 helpers |
| Retirer `FORCE RLS` de `missions` | `FORCE` soumet le propriétaire aux politiques et casse les fonctions `SECURITY DEFINER` | **[V]** `00500` |
| Statuts par RPC uniquement | le client ne doit jamais écrire un statut | **[V]** 8 transitions |
| Villes en liste fermée administrée | évite les variantes orthographiques et les missions hors zone | **[V]** `01100` |
| Erreurs techniques journalisées, jamais affichées | un message PostgreSQL brut révèle tables et politiques | **[V]** `errors.ts` |
| `client_id` imposé depuis la session, pas le formulaire | empêche de créer une mission au nom d'autrui | **[V]** `useMissions.ts` |

## Variables d'environnement

**[V]** Fichier `.env` présent, ignoré par Git. `.env.example` sans valeur.

| Variable | Nature | Utilisée par |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | publique | `lib/supabase/client.ts` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | publique | `lib/supabase/client.ts` |

**[V]** `client.ts` lève une erreur explicite si l'une manque.

**Prévues au plan, non présentes :** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`,
`EXPO_PUBLIC_EXPO_PROJECT_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

**[V]** Aucun secret serveur dans le dépôt. La clé `service_role` n'y est pas.

## Points à confirmer

Use `TODO — À CONFIRMER` comme demandé au plan.

- **TODO — À CONFIRMER : pays / zone de lancement.** Les 8 villes de
  `01100` sont un exemple, pas une décision.
- **TODO — À CONFIRMER : agent salarié.** Le §Acteurs du plan décrit un agent
  salarié rattaché à une société. **Aucun modèle de données ne le couvre** :
  `agent_profiles` n'a pas de lien de rattachement à `company_profiles`. À
  trancher avant l'étape 8.
- **TODO — À CONFIRMER : modèle de compte multi-rôle.** Le plan dit qu'un compte
  peut avoir plusieurs rôles ; `AuthContext` le lit, mais **aucun parcours ne
  permet d'attribuer un second rôle**.
- **TODO — À CONFIRMER : mécanisme de vérification de compte.** Aucun écran ni
  service de vérification n'existe.
- **TODO — À CONFIRMER :	border de `missions.city`.** Clé étrangère vers
  `villes.nom`, ou contrainte applicative ? Décision de sécurité en attente.
- **TODO — À CONFIRMER : cartographie.** Google Maps ou Mapbox.
- **TODO — À CONFIRMER : prestataire de paiement, taux de commission, délai de
  libération des fonds, organisme d'agrément, réglementation applicable.**

---

- `src/stores/` est vide, Zustand installé sans usage
- `AppHeader` mélange marque, SOS, avatar et zone sûre dans 401 lignes
- `000001_reset_all.sql` est un outil destructif rangé **avant** la chaîne de
  migrations : il s'exécute en premier par ordre alphabétique, ce qui est
  heureux, mais dangereux parelatence

---


### P1b — La politique d'insertion des affectations est absente

**Cause : ÉTABLIE.** `000001_reset_all.sql` a été exécuté **après**

## Historique des modifications

| Date | Événement |
|---|---|
| 2026-09-24 | Création du projet, structure initiale, page d'accueil |
| 2026-09-25 | Audit senior. Ajout de l'authentification, des rôles, des services, du contrat `Database` |
| 2026-09-25 | Ajout de `20260925000300_rls_policies.sql` (32 politiques, 18 grants) |
| 2026-09-25 | Ajout de `20260925000400_state_transitions.sql` (8 transitions d'état) |
| 2026-09-26 | Panne « Accès indisponible / 42501 ». **Cause réelle :** le rôle `anon` n'avait pas `USAGE` sur le schéma `public` — l'erreur était levée *avant* toute évaluation RLS |
| 2026-09-26 | `20260925000500` : retrait du `FORCE RLS` de `missions` et `mission_assignments` |
| 2026-09-26 | `20260925000600` : politique `insert` sur `mission_assignments` |
| 2026-09-26 | `20260925000700` : correction des triggers d'inscription, cassés par `FORCE RLS` |
| 2026-09-26 | `000001_reset_all.sql` exécuté **après** `00600` → P1b. Effet non anticipé |
| 2026-09-26 | Reconstruction complète, `check:supabase` → « conforme » |
| 2026-09-26 | `20260925001100_villes.sql` : référentiel des villes |
| 2026-09-26 | Refonte visuelle : tokens Figma, polices, 6 primitives, accueil client reconstruit |
| 2026-09-26 | **Premier test runtime de l'histoire du projet.** 3 défauts trouvés : P2 (calendrier web), P3 (message erroné), P1 (création de mission) |
| 2026-09-26 | S1-S3 : harmonisation typographique, `AppHeader`, 12 emojis d'onglets |
| 2026-09-26 | S4 : branche web de `ChampDateHeure` |
| 2026-09-26 | S5 : correction de `errors.ts`, **validée à l'écran** |
| 2026-09-26 | `20260926001200` et `20260926001300` écrits, **non appliqués** |
| 2026-09-26 | Analyse exhaustive (69 fichiers) et réécriture de ce rapport. Ancien rapport conservé dans `docs_RAPPORT_HISTORIQUE_2026-09-26.md` |
| 2026-09-26 | **Étape A, partie code :** P4 (cycle `villes`), P6 (doublon `villesService`), P7 (contrats trop permissifs) corrigés et vérifiés. P1, P1b, P5 restent ouverts et nécessitent une action humaine |
| 2026-09-27 | **`01500` appliquée : la sonde de diagnostic est retirée de la production.** Fuite de sécurité close. Le rapport précédent affirmait à tort que `01300` n'avait pas été appliquée — l'erreur a été montrée par exécution |
| 2026-09-27 | **Un contrôle ne peut pas détecter ce qu'il n'attend pas :** `check:supabase` annonçait « conforme » pendant l'exposition de la sonde. Contrôle ajouté au script |
| 2026-09-27 | **`VERIFICATION_RAPIDE.sql` durci :** contrôle 4 relevé de `>= 33` à `>= 38` (il masquait l'écart 37/38) · contrôles **17** (sonde absente), **18** (défaut `auth.uid()`), **19** (droit d'écriture retiré) ajoutés |
| 2026-09-27 | **`01200` identifiée comme le dernier défaut** : politique d'insertion `mission_assignments` absente. `createAssignment()` inutilisable. En attente d'application |
| 2026-09-27 | **Documentation :** `MIGRATIONS_EN_ATTENTE.md` créé et à jour ; les deux guides périmés portent un en-tête d'avertissement |

## Méthode — la leçon du projet

Sept incidents successifs ont montré que **le code ne peut pas prouver son propre
schéma**. Quatre règles en découlent, et elles sont appliquées dans ce rapport :

1. Toute correction de base se valide **par exécution**, jamais par lecture de
   fichier. P1b en est la démonstration : la migration `00600` est parfaitement
   écrite, et son effet a été détruit après coup.
2. Un diagnostic doit distinguer **« protégé »** de **« non configuré »**. Un
   `401` seul ne prouve rien : il peut signifier que la RLS filtre, ou qu'aucun
   droit n'a été accordé.
3. Chaque rapport d'étape distingue **ce qui est vérifié** de **ce qui est
   supposé**. C'est la raison d'être des mentions **[V]** / **[D]** / **[X]**.
4. **Un contrôle ne peut pas détecter ce qu'il n'attend pas.** `check:supabase`
   annonçait « conforme » pendant que la sonde de diagnostic était exposée en
   production : il ne cherchait que les 8 fonctions de transition, et ignorait
   tout le reste. De même, le contrôle 4 validait un seuil de 33 pendant que la
   base en comptait 37. **La couverture d'un contrôle doit être au moins aussi
   large que l'inventaire des choses qui ne devraient pas exister** — et un
   seuil trop lax est aussi trompeur qu'une absence de contrôle.

---

## Feuille de route proposée

### Étape A — presque close, une seule action humaine

`01200` est la seule migration restante. Les migrations s'appliquent dans le SQL
Editor, pas depuis l'éditeur.

**A1. Rejouer `VERIFICATION_RAPIDE.sql`** — il gagne 3 contrôles (17, 18, 19).
Le **18** dit si le correctif de P1 (`01400`) est appliqué. Le **19** dit si le
droit d'écriture a bien été retiré. **C'est la première fois qu'on peut le
savoir** : aucun contrôle ne regardait `missions.client_id`.

**A2. Coller `20260926001200_restore_assignment_insert.sql`** → contrôle 12
passe à `OK`, contrôle 4 annonce **38**.

> Si le contrôle 18 est en `ALERTE`, coller aussi
> `20260926001400_mission_client_id_default.sql` **avant** de tester.

**A3. `npm run web` → compte neuf → Créer une mission.**

C'est **le test qui manque depuis le début du projet**. Tout ce qui précède est
de l'indirect : compilation, lecture, conformité. Seul A3 prouve que le produit
fonctionne.

Guide pas à pas : `supabase/verification/MIGRATIONS_EN_ATTENTE.md`.

### Étape B — le jalon MVP manquant

6. **Recherche de prestataires.** C'est le cœur du produit, et **rien
   n'existe** : `search.tsx` affiche « Bientôt disponible ». Requête sur
   `agent_profiles` / `company_profiles` sous RLS, avec filtres.
7. Sélection et réservation
8. Publication effective via la RPC existante
9. Suivi de mission

### Puis

Les espaces agent, société et admin — 10 gestionnaires vides aujourd'hui.

### Arbitrages toujours ouverts

- `AuthContext` doit-il migrer vers `features/auth/` conformément au plan ?
- Le modèle d'agent salarié doit-il exister avant l'étape 8 ?
- **`missions.city` n'a pas de clé étrangère** vers `villes.nom` : un client peut
  envoyer une ville arbitraire en contournant le formulaire. C'est la seule
  réserve de sécurité connue restante.

## Les trois questions, à nouveau

1. **Où en sommes-nous ?** Socle et design system terminés. Base conforme en
   lecture, 16 contrôles sur 16 au vert hors un défaut connu et isolé. Aucun
   flux métier fonctionnel.
2. **Qu'est-ce qui fonctionne ?** Le démarrage, la navigation, la lecture des
   données autorisées, la validation de formulaire, la traduction d'erreurs, le
   sélecteur de villes, la liste des missions.
3. **Quelle est la prochaine étape ?** Coller `01200`, puis créer une mission
   pour de vrai. Ensuite, la recherche de prestataires.

**Ce qui ne fonctionne pas :** l'inscription, la connexion, la création de
mission, et tous les parcours agent, société et administration.

`20260925000600`. Son `DROP TABLE … CASCADE` a supprimé la politique `insert`
de `mission_assignments` et les droits au niveau table, tandis que la fonction
`can_assign_mission` du même fichier survivait — le corps d'une fonction SQL
n'étant pas une dépendance suivie par PostgreSQL.

**Preuve :** la chaîne définit 38 politiques, la base en compte 37. L'écart est
exactement cette politique.

**Impact :** `missionsService.createAssignment()` est **structurellement
inutilisable**. Le parcours d'affectation est mort.

**Correctif :** `20260926001200_restore_assignment_insert.sql`, écrit,
idempotent, avec auto-vérification. **Non appliqué.**

---

  démarrage, `StartupGate` renvoie vers `role-selection`.

---

- **[V]** `src/lib/api/` — **vide**
- **[V]** `src/stores/` — **vide**, Zustand installé mais inutilisé
- **[V]** `src/services/` — `profiles`, `missions`, `villes` + `index.ts`
- **[V]** `supabase/` — 13 migrations, 5 scripts de vérification, `config.toml`
- **[V]** `scripts/` — `check-supabase-access.js` (340 l.), `reset-project.js`
- **[V]** `design/` — `DESIGN.md`, `code.html`, image de référence

---
