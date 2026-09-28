# RAPPORT PROJET — SECU GUARD

> **Document de référence unique.** Réécrit intégralement le **2026-09-28**.
>
> La version précédente datait des 26 et 27 septembre. Elle s'était accumulée en
> trois strates contradictoires et ne pouvait plus servir de mémoire : elle
> disait vrai et faux dans la même page. Le rapport de l'audit du 26 septembre
> est conservé, intact, dans `docs_RAPPORT_HISTORIQUE_2026-09-26.md` (539
> lignes). **Ce document fait foi** pour l'état courant.
>
> ### Convention de lecture
>
> Chaque affirmation porte l'une de ces mentions :
>
> - **[V]** vérifié par exécution ou lecture directe du code ;
> - **[D]** déduit, non exécuté ;
> - **[X]** non vérifié, à confirmer.
>
> ### Ce qui a changé le 2026-09-28
>
> Trois choses, qui viennent toutes de l'exécution et non de la lecture :
>
> 1. La base distante a été mesurée : **22 contrôles sur 22 au vert**.
> 2. `VERIFICATION_RAPIDE.sql` était **cassé depuis le 27/09 à 23h52** et ne
>    pouvait plus rien vérifier. Corrigé, puis étendu à 21 contrôles.
> 3. Le plan des 14 étapes a été fourni. Il n'existait nulle part dans le dépôt :
>    les « étapes 7 à 13 » citées jusqu'ici n'étaient invérifiables par personne.

---

## État actuel

**Trois parcours métier sont validés à l'écran, pour la première fois depuis le
début du projet.** Le projet ne compile plus seulement : il fait.

| Domaine | État | Preuve |
|---|---|---|
| Socle technique | ✅ Opérationnel | **[V]** `tsc --noEmit` vide · `npx eslint .` exit 0 · 91 fichiers `.ts`/`.tsx` |
| Design system | ✅ Opérationnel | **[V]** tokens centralisés, 6 primitives, aucune couleur en dur |
| Base Supabase | ✅ **Saine** | **[V]** **22 contrôles sur 22 au vert** |
| Sécurité de la base | ✅ Sonde retirée | **[V]** contrôle 17 = `0` |
| Authentification | ✅ **Validée** | **[V]** `getUser()` serveur, profil et rôles chargés |
| **Parcours client** | ⚠️ **Partiel** | **[V]** demande et recherche validées · **réservation et suivi absents** |
| **Fiche agent** | ✅ **Fonctionnelle** | **[V]** création et modification depuis l'écran, valeurs en base |
| **Parcours agent** | ❌ **1 item sur 6** | **[V]** seul le profil existe |
| Espaces société / admin | ❌ **Écrans vides** | **[V]** aucune requête de donnée |
| Affectation / réservation | ⚠️ **Écriture validée, lecture absente** | **[V]** le client réserve et voit la ligne · **[X] le prestataire ne voit rien** |


### Réponse aux trois questions

1. **Où en sommes-nous ?** Socle, architecture et design system terminés. Base
   conforme et désormais **mesurée**. Étapes 0 à 5 terminées. **Étape 6 aux
   quatre cinquièmes**, étape 7 à un sixième.
2. **Qu'est-ce qui fonctionne ?** L'application démarre, s'exporte, navigue,
   branche l'authentification, **crée une mission, la publie, crée et modifie
   une fiche agent, retrouve un agent par un client, et réserve ce client sur
   sa mission**. Le parcours client va jusqu'à l'affectation.
3. **Quelle est la prochaine étape ?** **L'acceptation côté agent.** Le client
   réserve, mais le prestataire ne peut ni voir sa demande, ni y répondre :
   l'affectation restera `pending` indéfiniment.

### Réserve générale

**[V]** Aucun test automatisé n'existe. Les seules validations sont `typecheck`,
`lint`, `npx eslint .`, un export web et des tests manuels. **Rien n'a été
vérifié sur un appareil mobile.** L'absence de test automatisé a laissé passer
**cinq défauts** qu'aucun contrôle existant ne pouvait voir (voir « Problèmes
rencontrés »).

---

## Étape en cours

### ÉTAPE 6 du plan — PARCOURS CLIENT : 3 jalons sur 5

| Jalon | État | Preuve |
|---|---|---|
| Demande | ✅ **Validée à l'écran** | **[V]** mission créée le 2026-09-27, valeurs en base |
| Recherche | ✅ **Validée à l'écran** | **[V]** agent retrouvé par un compte client |
| Sélection | ⚠️ **Partielle** | **[D]** la carte s'affiche ; **pas d'écran de détail, pas de passage à la réservation** |
| Réservation | ✅ **Validée à l'écran** | **[V]** 2026-09-28 : 2 affectations créées, `status = pending`, cibles `agent` |
| Suivi | ❌ **Absent** | **[V]** aucune vue de mission en cours |

### Ce que la base offre déjà, et qui n'est pas utilisé

L'affectation est le seul domaine où **le serveur est plus avancé que le
client**. Tout est en place et mesuré :

| Brique | État | Preuve |
|---|---|---|
| Helper `private.can_assign_mission` | ✅ en base | **[V]** contrôle 11 = `1` |
| Politique `insert` sur `mission_assignments` | ✅ en base | **[V]** contrôle 12 = `1` |
| Droits d'écriture | ✅ en base | **[V]** contrôle 20 = `4`, et `status` / `report` / pointages **exclus** |
| Visibilité des prestataires | ✅ en base | **[V]** contrôle 21 = politique ouverte **et** fonction publique présente |
| `createAssignment` (service) | ✅ écrit | **[V]** `.select()` retiré le 2026-09-28 |
| `publishMission` | ✅ **Validée à l'écran** | **[V]** 2026-09-28 : première transition d'état jamais exécutée, **elle fonctionne** |
| `createAssignment` | ✅ **Validée à l'écran** | **[V]** 2 lignes créées, politique et `grant` acceptés |
| `acceptAssignment`, `rejectAssignment` | ⚠️ codés | **[X]** jamais exécutés — étape 7 |
| Hook `useAssignments` | ✅ **écrit** | **[V]** `useReserverPrestataire`, `useAffectationsMission` |
| Écran de réservation (client) | ✅ **écrit** | **[V]** `(client)/prestation/[id]` |
| Écran d'affectation (agent) | ❌ **absent** | étape 7 |

### Correction de nomenclature

**[V]** La version précédente de ce rapport appelait « étape 7 » le parcours
d'affectation. Avec le plan en main, c'est inexact : **l'étape 7 du plan est le
PARCOURS AGENT**. L'affectation appartient aux deux derniers jalons de l'étape 6
(*réservation*, *suivi*). Les libellés de ce rapport suivent désormais le plan.

---

## Étapes terminées

| Étape | Statut | Nature de la validation |
|---|---|---|
| 0 — Environnement | ✅ | **[V]** Node 24.15.0, npm 11.12.1, Expo 57.0.25, Router 57.0.23, TypeScript 6.0.3 |
| 1 — Architecture | ✅ | **[V]** structure conforme au plan, design system, `RAPPORT_PROJET.md` |
| 2 — Page d'accueil | ✅ | **[V]** `welcome.tsx`, export web, polices chargées avant le splash |
| 3 — Supabase | ✅ | **[V]** 21 contrôles au vert · **écriture testée à l'écran** |
| 4 — Authentification | ✅ | **[V]** inscription, connexion, session persistante, rôles |
| 5 — Routing par rôle | ✅ | **[V]** les 4 groupes rendent, `ProtectedRoute` par rôle |
| 6 — Parcours client | ⚠️ **en cours** | **[V]** demande et recherche validées · **réservation et suivi restants** |
| 6 bis — Fiche agent | ✅ | **[V]** création **et** modification, valeurs en base |
| 6 ter — Recherche | ✅ | **[V]** agent retrouvé par un compte client |

> L'étape 6 est marquée « en cours », pas « terminée ». Les étapes 6 bis et
> 6 ter sont des jalons de l'étape 6, pas des étapes indépendantes.

---

## Prochaine étape

### ÉTAPE 6 (suite) — RÉSERVATION : le client réserve un prestataire

**C'est le dernier verrou du parcours client.** Tant qu'il n'est pas franchi,
l'application ne sert à rien : un client peut formuler un besoin et trouver des
prestataires, mais ne peut pas les engager.

**Sous-étapes réalisées et validées le 2026-09-28 :**

| # | Sous-étape | Fichiers | État |
|---|---|---|---|
| 1 | Bouton « Publier » sur un brouillon, via la RPC `publish_mission` | `MissionCard.tsx`, `(client)/missions.tsx` | ✅ **validé à l'écran** |
| 2 | Hook `useAssignments` | `features/missions/useAssignments.ts` | ✅ **validé** |
| 3 | Écran de réservation | `(client)/prestation/[id].tsx` | ✅ **validé** |
| 4 | `createAssignment`, sans `.select()` | `missions.service.ts` | ✅ **validé** |
| 5 | Lecture des affectations, sans imbrication | `listerAffectationsMission` | ✅ **validé** |
| 6 | Traduction du doublon `23505` et blocage avant clic | `errors.ts`, écran de réservation | ✅ codé, **[X] non testé** |

### Le test qui a jugé l'étape — RÉUSSI

**[V]** Le 2026-09-28, avec un compte client, dans le navigateur :

1. Publier un brouillon → le badge passe à `Publiée`
2. Rechercher → toucher une carte → écran de réservation
3. Choisir la mission → **Réserver**
4. Contrôle en base : **2 lignes** créées, `status = pending`, cible `agent`,
   mission `published`

C'est la **première transition d'état jamais exécutée** dans ce projet, et elle
fonctionne. C'est aussi la première fois qu'une écriture de `mission_assignments`
passe réellement par la politique et le `grant`.

### Ce qui reste ouvert, et c'est l'essentiel

- **[X] Le prestataire ne voit RIEN de cette affectation.** L'écran agent
  n'existe pas. La politique `can_view_assignment` n'a donc jamais été
  évaluée du côté agent.
- **[X] `accept_assignment` et `reject_assignment` ne sont toujours jamais
  exécutées.** L'affectation restera `pending` indéfiniment.
- **[X] `getAgentMissions()`** interroge `missions` par imbrication. C'est le
  motif qui a déjà cassé deux fois, et il n'a jamais été exécuté.

### Ce qui suit, et qui n'est pas fait

- **[D]** `missions.city` sans clé étrangère : décision par défaut, **migration
  non écrite**, en attente de validation séparée.
- **[V]** `mission/new` n'est pas déclaré dans le `_layout` du groupe client :
  il apparaît probablement comme un onglet. Signalé, non corrigé hors périmètre.

**Séquence confirmée par l'exécution :** la publication précède bien la
réservation. La politique d'insertion exige `m.status = 'published'`, et une
affectation sur un brouillon serait refusée.

---

## Architecture

### Cible (issue du plan, section 5)

```text
src/
├── app/                    Expo Router : layouts et écrans uniquement
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/  (client)/  (agent)/  (company)/  (admin)/
├── components/
│   ├── ui/                 transverses, sans logique métier
│   ├── forms/
│   └── common/
├── features/               logique métier, un dossier par domaine
│   ├── auth/  clients/  agents/  companies/  missions/
│   └── payments/  chat/  notifications/  reviews/
├── hooks/
├── stores/                 Zustand, uniquement si justifié
├── services/               accès aux données
├── lib/
│   ├── supabase/           SEUL point d'accès à Supabase
│   ├── api/
│   └── utils/
├── types/                  contrats centralisés
└── constants/              couleurs, espacements, tailles
```

### État réel et écarts

**[V]** La structure suit le plan, avec quatre écarts :

| Écart | État réel | Traitement |
|---|---|---|
| `features/auth/` | absent — `AuthContext` est dans `src/context/` | **[D]** à déplacer, sinon la règle « logique métier dans `features` » n'est pas tenue. **Non fait sans accord.** |
| `features/clients/`, `agents/`, `companies/`, `payments/`, `chat/`, `notifications/`, `reviews/` | absents | **[V]** normal : ces domaines ne sont pas encore construits |
| `lib/api/` | vide | **[V]** aucun besoin : `supabase-js` suffit à ce stade |
| `stores/` | vide, `zustand` installé | **[V]** installé sans usage, prévu pour les étapes 10-11 |

**Règle appliquée sans exception :** `src/lib/supabase` est le seul module qui
importe le client. `src/app` ne contient que des écrans, `features` porte la
logique métier, `components` reste transverse.

---

## Structure des dossiers

**[V]** 91 fichiers `.ts` / `.tsx`.

| Dossier | Fichiers | Contenu |
|---|---|---|
| `src/app` | 31 | écrans et layouts Expo Router, 6 groupes |
| `src/components` | 25 | `ui` 6 · `common` 9 · `forms` 5 · `auth` 3 · `navigation` 2 |
| `src/features` | 12 | `missions` 4 · `prestataires` 5 · `villes` 3 |
| `src/lib` | 11 | `supabase` 6 · `storage` 2 · `utils` 2 · `queryClient` 1 |
| `src/services` | 5 | `missions` · `providers` · `profiles` · `villes` · `index` |
| `src/hooks` | 3 | `useAuth` · `useProfile` · `index` |
| `src/context` | 2 | `AuthContext` · `index` |
| `src/constants` | 1 | tokens centralisés |
| `src/types` | 1 | contrats dérivés du schéma |

**Les 6 groupes de routage :**

| Groupe | Écrans | État |
|---|---|---|
| `(startup)` | `onboarding`, `profile-selection` | ✅ |
| `(auth)` | `sign-in`, `sign-up`, `role-selection` | ✅ |
| `(client)` | `index`, `missions`, `mission/new`, `search`, `profile` | ⚠️ 4 sur 5 |
| `(agent)` | `index`, `profile`, `missions`, `availability` | ⚠️ 1 sur 4 |
| `(company)` | `index`, `profile`, `missions`, `team` | ❌ 0 sur 4 |
| `(admin)` | `index`, `users`, `missions`, `profile` | ❌ 0 sur 4 |

**Fichiers racine :** `app.json` · `tsconfig.json` · `eslint.config.js` ·
`.env` / `.env.example` · `AGENTS.md` · `README.md` · `RAPPORT_PROJET.md` ·
`design/` (maquette Figma) · `dist/` (export web)

---

## Technologies

**[V]** Relevé le 2026-09-28 sur les versions réellement installées.

| Domaine | Version | Rôle |
|---|---|---|
| Node.js | 24.15.0 | environnement |
| npm | 11.12.1 | dépendances |
| Expo | 57.0.25 | framework |
| Expo Router | 57.0.23 | navigation, point d'entrée |
| React Native | 0.86.3 | runtime |
| React | 19.2.3 | — |
| TypeScript | 6.0.3 | **mode `strict`**, aucun `any` |
| @supabase/supabase-js | 2.117.1 | client, Auth, RPC |
| @tanstack/react-query | 5.103.2 | état serveur, distinction chargement / vide / erreur |
| zod | 4.6.5 | validation, messages en français |
| react-hook-form | 7.88.0 | formulaires |
| zustand | 5.0.15 | **installé, inutilisé** |
| @expo/vector-icons | 15.1.1 | icônes Material dans les onglets |

**Absents, et prévus par le plan :** `expo-notifications`, `expo-maps` ou
`react-native-maps`, `expo-location`, Stripe. Tous arrivent par les étapes 10 et
11. **Aucun n'est installé** : rien n'est importé par erreur.

**Configuration notable :** `experiments.reactCompiler` et `typedRoutes` sont
actifs dans `app.json` ; le plugin `expo-router` est déclaré.

---

## Base de données

**PostgreSQL avec RLS sur les 13 tables du schéma `public`.** La référence
unique est `supabase/migrations/`, pas les fichiers `SUPABASE_SCHEMA_*.sql` de la
racine, qui divergent.

### Migrations

**[V]** 19 fichiers : `000001_reset_all.sql` (destructif) et 18 migrations datées
`20260925000100` à `20260926002000`.

| Migration | Objet |
|---|---|
| `00100` | schéma, relations, triggers d'inscription |
| `00200` | 6 helpers RLS en `SECURITY DEFINER`, schéma `private` |
| `00300` | 32 politiques, 18 grants granulaires par colonne |
| `00400` | 8 transitions d'état, côté serveur |
| `00500` | retrait du `FORCE RLS` sur `missions` et `mission_assignments` |
| `00600` | politique `insert` sur `mission_assignments` |
| `00700` | correction des triggers d'inscription, cassés par `FORCE` |
| `00900` | convergence du schéma |
| `01000` | restauration des clés étrangères |
| `01100` | référentiel `villes` — 8 villes, liste fermée |
| `01200` | restauration de la politique `insert` des affectations |
| `01300` | sonde de diagnostic — montée, puis retirée |
| `01400` | `DEFAULT auth.uid()` sur `missions.client_id` — **ABANDONNÉE** |
| `01500` | **retrait de la sonde de diagnostic** |
| `01600` | trigger `BEFORE INSERT` qui impose `client_id` |
| `01800` | restauration des droits sur les fiches prestataires |
| `01900` | agents visibles par les clients |
| `02000` | annuaire des prestataires, `liste_agents_publics` |

> **[X] Numérotation trouée : `00800` et `01700` n'existent pas.** Sans
> conséquence connue, mais à confirmer — migration supprimée ou jamais écrite ?

> ⚠️ **`000001_reset_all.sql` est un outil destructif** rangé **avant** la
> chaîne. Son exécution **après** une migration a créé le défaut P1b. Tout
> fichier destructeur passe avant les migrations, jamais après.

### Les 13 tables et leur usage réel

**[V]** Six tables n'ont **aucune référence** dans le code client :

| Utilisé par l'application | Jamais utilisé |
|---|---|
| `profiles`, `profile_roles`, `agent_profiles`, `company_profiles`, `missions`, `mission_assignments`, `villes` | **`documents`, `wallets`, `transactions`, `reviews`, `messages`, `notifications`** |

> Le schéma est conçu pour une application nettement plus vaste que celle qui
> existe. Six tables attendent un écran qui n'est pas écrit — c'est normal, ce
> sont les étapes 7 à 11.

### Contrôles

**[V]** `supabase/verification/` — 8 fichiers de contrôle et de guide.

| Fichier | Rôle |
|---|---|
| `VERIFICATION_RAPIDE.sql` | **21 contrôles**, un seul `SELECT`, un seul verdict |
| `VERIFICATION_POST_MIGRATION.sql` | 19 contrôles détaillés, un par un |
| `LISTE_POLITIQUES.sql`, `DIAGNOSTIC_ETAT.sql`, `ETAT_DROITS_AGENT.sql` | diagnostics |
| `MIGRATIONS_EN_ATTENTE.md`, `GUIDE_APPLICATION_MIGRATIONS.md`, `RECONSTRUCTION_BASE.md` | ⚠️ guides, **deux périmés** |

> ⚠️ **`MIGRATIONS_EN_ATTENTE.md` est périmé et dangereux** : il prescrit
> d'appliquer `01200`, qui est **déjà appliquée**. À remplacer.

### Machines à états

**[V]** 8 RPC `SECURITY DEFINER`, accordées à `authenticated` et révoquées pour
`anon`. Le client n'écrit **jamais** un statut.

**Mission** — `draft`, `published`, `accepted`, `in_progress`, `completed`,
`cancelled`, `disputed`, `paid`

| Transition | RPC |
|---|---|
| publier | `publish_mission` |
| annuler | `cancel_mission` |
| terminer | `complete_mission` |
| marquer payée | `mark_mission_paid` |
| ouvrir un litige | `open_mission_dispute` |

**Affectation** — `pending`, `accepted`, `rejected`, `completed`

| Transition | RPC |
|---|---|
| accepter | `accept_assignment` |
| refuser | `reject_assignment` |
| terminer | `complete_assignment` |

**Prestataire** — **[D]** sept valeurs, dont `registered` et `validated`
confirmées par la politique de `01900`. Le plan enchaîne inscription → documents
soumis → en validation → validé / rejeté → actif → suspendu ; l'écran
d'administration correspondant n'existe pas.

### Ce que les contrôles ne prouvent pas

**[V]** `check:supabase` ne teste **que le rôle `anon`**. Une politique qui ferme
à un client ferme aussi à `anon` : les deux cas sont indiscernables de
l'extérieur. Le script le dit lui-même, et c'est la règle de `AGENTS.md` qu'il
faut appliquer à tout contrôle ajouté.

---

## Authentification

**Supabase Auth, session persistante, multi-rôle.** Validé à l'écran le
2026-09-27.

| Élément | État | Preuve |
|---|---|---|
| `signUp` / `signIn` / `signOut` / `getSession` | ✅ | **[V]** exécutés à l'écran |
| Session persistante après redémarrage | ✅ | **[V]** `expo-secure-store` + `StartupGate` |
| `getUser()` **côté serveur** | ✅ | **[V]** `lib/supabase/auth.ts` — jamais la session locale pour décider d'une identité |
| `AuthContext` centralise `session`, `user`, `profile`, `roles`, `loading`, `error`, `isServiceIssue` | ✅ | **[V]** `src/context/AuthContext.tsx` |
| Multi-rôle lu correctement | ✅ | **[V]** fusion de `profiles.role` et `profile_roles`, dédupliquée par `Set` |
| Erreurs techniques **jamais** affichées | ✅ | **[V]** `toUserFacingError()` ; le détail part dans `technicalDetail` |
| `StartupGate` vers `role-selection` si `roles.length > 1` | ✅ | **[V]** |
| Choix d'espace en multi-rôle **persisté** | ❌ | **[V]** absent — perdu à chaque lancement |
| Attribution d'un second rôle | ❌ | **[V]** aucun parcours ne le permet |
| Vérification de compte | ❌ | **[V]** aucun écran ni service |

> **Sécurité.** `ProtectedRoute` et `StartupGate` sont une **aide d'interface**,
> pas une barrière. La barrière est la RLS. Un utilisateur peut contourner le
> routage en appelant l'API directement. Ne jamais les présenter comme une
> protection.

---

## Navigation

**Expo Router**, groupes de fichiers, un `Stack` racine unique.

```
src/app/_layout.tsx
  └─ SafeAreaProvider        ← obligatoire : sans lui, useSafeAreaInsets()
  │                            renvoie { top: 0 } et les SafeAreaView
  │                            ne protègent rien
  └─ QueryClientProvider
     └─ AuthProvider
        └─ Stack (headerShown: false)
           ├─ index.tsx            → StartupGate
           ├─ welcome.tsx          → accueil public
           ├─ (startup)/           → onboarding, profile-selection
           ├─ (auth)/              → sign-in, sign-up, role-selection
           ├─ (client)/  (agent)/  (company)/  (admin)/
```

**[V]** Chaque groupe protégé est enveloppé par `ProtectedRoute`, qui vérifie
`requireAuth` et `requireRole`.

**[V]** Barres d'onglets unifiées par `src/components/navigation/tabBarOptions.ts` :
icônes Material, filet cyan, ombre, police de libellé. Les emojis des onglets
ont été supprimés.

**[V]** `experiments.typedRoutes` est actif : les routes sont vérifiées à la
compilation. C'est une garantie réelle contre les fautes de frappe dans les
`router.push`.

---

## Fonctionnalités développées

### Validées à l'exécution **[V]**

| Fonctionnalité | Preuve |
|---|---|
| Démarrage de l'application | export web, **39 entrées de route** |
| Chargement des polices avant le splash | 8 graisses, splash bloqué |
| Navigation par onglets, 4 espaces | icônes Material rendues |
| Inscription, connexion, déconnexion | exécution à l'écran le 2026-09-27 |
| Session persistante | `expo-secure-store` |
| Ouverture de la ville | `SelectVille` : liste fermée, recherche, sélection |
| **Création d'une mission** | mission créée depuis l'écran, valeurs en base |
| **Fiche agent : création** | ligne écrite en base |
| **Fiche agent : modification** | valeurs relues en base |
| **Recherche de prestataires** | agent retrouvé par un compte client |
| **Publication d'une mission** | RPC `publish_mission` — première transition jamais exécutée, **réussie** |
| **Réservation d'un prestataire** | 2 affectations créées, `status = pending`, mission `published` |
| Validation des formulaires | Zod, messages en français |
| États pending / error / vide distincts | TanStack Query, trois rendus séparés |
| Traduction des erreurs | `errors.ts` : aucun message technique affiché |

### Codées, jamais exécutées **[X]**

| Fonctionnalité | Pourquoi c'est un risque |
|---|---|
| `acceptAssignment`, `rejectAssignment` | **jamais exécutées** — l'affectation reste `pending` sans fin |
| `getAgentMissions` | imbrique `missions(...)` : le motif qui a cassé deux fois, jamais exécuté |
| `checkIn`, `checkOut`, rapport | étape 7 |
| `updateMission` | colonnes restreintes par le `grant update` |

> Ces fonctions sont **compilantes et non testées**. Un code qui compile n'a
> jamais été exécuté. Elles n'ont pas davantage de preuve d'exister que le
> `VERIFICATION_RAPIDE.sql` cassé.

### Écrans vides — aucune fonctionnalité **[V]**

**10 gestionnaires `onPress={() => {}}` sur 7 écrans**, et **3 écrans
« Bientôt disponible »** :

| Écran | Constat |
|---|---|
| `(agent)/index.tsx` | 2 boutons vides |
| `(agent)/missions.tsx` | 1 bouton vide |
| `(agent)/availability.tsx` | 1 bouton vide + « Bientôt disponible » |
| `(company)/index.tsx` | 2 boutons vides |
| `(company)/missions.tsx` | 1 bouton vide |
| `(company)/team.tsx` | 1 bouton vide |
| `(admin)/index.tsx` | 2 boutons vides |
| `(admin)/users.tsx` | « Bientôt disponible » |
| `(admin)/missions.tsx` | « Bientôt disponible » |
| 3 × `profile.tsx` (client, company, admin) | statiques |

> **Aucune requête de données** dans les espaces agent, société et
> administrateur, à l'exception de la fiche agent.

---

## Fonctionnalités restantes

### Étape 6 — à finir

- **[V]** Sélection : carte désormais actionnable, écran de réservation écrit
- **[V]** Réservation : publication et `createAssignment` écrits
- **[V]** **Test fonctionnel de bout en bout** — c'est ce qui manque, et c'est
  désormais le seul obstacle de l'étape
- **[V]** Suivi : voir la mission et son prestataire — non commencé

### Étape 7 — parcours agent

- **[V]** Documents justificatifs — table `documents` existante, aucun écran
- **[V]** Disponibilités — `is_available` existe dans le schéma, aucun écran
- **[V]** Réception et liste des missions
- **[V]** Acceptation et refus
- **[V]** Check-in / check-out et rapport

### Étapes 8 à 13

| Étape | Contenu | Blocage |
|---|---|---|
| 8 — Société | profil, équipe, agents, missions, affectations | modèle d'agent salarié non modélisé |
| 9 — Admin | validation des comptes, documents, utilisateurs, missions, litiges | aucun écran |
| 10 — Paiement | Stripe, commission, transactions, webhooks, wallet | **prestataire et taux non confirmés** |
| 11 — Temps réel | localisation, suivi, chat, notifications | **cartographie non choisie** |
| 12 — Qualité | tests, sécurité, performances, audit | **aucun test automatisé** |
| 13 — Production | builds, environnement de production, monitoring | — |

---

## Problèmes rencontrés

**Cinq défauts ont survécu à une chaîne de contrôles entièrement verte.** Aucun
n'était détectable de l'extérieur. Ils sont listés par gravité, avec la cause
**ÉTABLIE** ou **NON ÉTABLIE** — et une cause non établie n'est jamais inventée.

### Les six défauts invisibles

| # | Défaut | Pourquoi aucun contrôle ne le voyait | Cause |
|---|---|---|---|
| 1 | `mission_assignments` sans politique `insert` | le contrôle 12 le voyait ; le **bilan global** annonçait « conforme » | **[V] ÉTABLIE** |
| 2 | `DEFAULT auth.uid()` de `01400` | le contrôle 18 mesurait sa **présence**, jamais son **moment d'évaluation** | **[V] ÉTABLIE** |
| 3 | `grant select` absent sur `agent_profiles` | le contrôle ne demandait que les `INSERT` | **[V] ÉTABLIE** |
| 4 | `profiles!inner(full_name, city, postal_code)` | **aucun contrôle n'existait** ; et `profiles` n'a ni `city` ni `postal_code` | **[V] ÉTABLIE** |
| 5 | politique de lecture des agents fermée aux clients | **aucun contrôle n'existait** ; invisible aussi à `check:supabase`, qui ne teste que `anon` | **[V] ÉTABLIE** |
| 6 | **`company_profiles` fermée aux clients** | le contrôle 21 ne regarde que `agent_profiles` — la table que `01900` venait de corriger | **[V] ÉTABLIE** |

**Le motif est toujours le même :** une politique qui ferme à un client ferme
aussi à `anon`, donc le contrôle automatique ne peut pas la voir. Une base
conforme n'est pas une base correcte.

**Le défaut 6 est le plus instructif**, parce qu'il est **né d'un correctif** :
`01900` a ouvert `agent_profiles` aux clients en 2026-09-27, et le contrôle 21,
écrit le même jour, n'a vérifié que cette table. `company_profiles` est restée
fermée depuis le début. Résultat : **la recherche n'a jamais affiché une
société**, et le test du 2026-09-27 a trouvé un agent — on cherchait un agent, on
a trouvé un agent.

> Un contrôle écrit au même moment qu'un correctif valide naturellement ce que
> ce correctif vient de faire. Ce qu'il ne fait pas, c'est vérifier ce qu'il
> n'a pas touché. La couverture d'un contrôle doit suivre l'inventaire, pas
> l'ordre des travaux.

### P1 — création d'une mission refusée

**Symptôme :** `new row violates row-level security policy for table "missions"`.

**Cause racine : [X] NON ÉTABLIE.** C'est le point le plus instructif du projet,
et il n'est pas clos.

Sept conditions ont été vérifiées **vraies, dans la même exécution que
l'insertion qui échoue** : la politique `insert`, `auth.uid()`, le `client_id`
envoyé, le `status`, les droits accordés, l'absence de trigger, `FORCE RLS` levé,
aucune politique `RESTRICTIVE`. La ligne satisfait la clause et PostgreSQL la
refuse quand même.

**Ce qui a été éliminé :** la cause n'était pas dans le schéma. Un `INSERT`
identique exécuté dans le SQL Editor, en rôle `authenticated`, avec le même
jeton, réussit. Le défaut est dans la **manière dont l'application émet la
requête**, pas dans la base.

**Le mécanisme, mesuré :** `.insert().select()` envoie
`Prefer: return=representation`. PostgREST insère la ligne, puis la **relit** —
et cette relecture est soumise à la politique de SELECT, donc à un
`SECURITY DEFINER` qui interroge trois tables. La preuve est la comparaison de
deux requêtes identiques dont seul l'en-tête diffère :

```
return=minimal         -> 201   l'écriture passe
return=representation  -> 403   la relecture échoue
```

**Pourquoi `DEFAULT auth.uid()` ne pouvait pas marcher :** un `DEFAULT` n'est pas
de la donnée ; PostgreSQL l'évalue en **préparant** l'instruction. Via PostgREST,
cette préparation a lieu dans le rôle *préparé*, **avant** l'installation du
jeton : `auth.uid()` y vaut `NULL`. La clause `client_id = auth.uid()` s'évalue
donc à `NULL`, donc fausse, et la ligne est refusée — sans qu'aucune condition
de `WITH CHECK` ne soit fausse. `01600` déplace l'écriture au moment de
l'**exécution**, via un trigger `BEFORE INSERT`.

### Les autres incidents

| Incident | Cause | Résolu |
|---|---|---|
| Panne « Accès indisponible / 42501 » | **[V] ÉTABLIE** — `anon` n'avait pas `USAGE` sur le schéma `public` ; l'erreur était levée **avant** toute évaluation RLS | ✅ `00300` |
| Publication et acceptation inopérantes | **[V] ÉTABLIE** — `FORCE RLS` soumettait le propriétaire aux politiques et cassait les fonctions `SECURITY DEFINER` | ✅ `00500` |
| Inscription impossible | **[V] ÉTABLIE** — même cause, sur les triggers d'inscription | ✅ `00700` |
| P1b — politique d'insertion disparue | **[V] ÉTABLIE** — `DROP TABLE ... CASCADE` de `000001_reset_all.sql` exécuté **après** `00600` : il a supprimé la politique et les droits, **pas** la fonction, dont le corps n'est pas une dépendance suivie par PostgreSQL | ✅ `01200` |
| P2 — calendrier natif sur le web | **[V] ÉTABLIE** — `ChampDateHeure` n'utilisait que le composant natif | ✅ branche web |
| P3 — message d'erreur erroné | **[V] ÉTABLIE** — traductions mal séparées dans `errors.ts` | ✅ `errors.ts` |
| P4 — cycle d'import `villes` | **[V] ÉTABLIE** — un composant exporté par un baril importait ce même baril | ✅ import direct |
| P6 — doublon `villesService` | **[V] ÉTABLIE** — deux services au même rôle | ✅ `listCities` |
| Contrôle 4 en faux vert | **[V] ÉTABLIE** — seuil `>= 33`, trop lax pour voir l'écart de 4 politiques | ✅ seuil sur 37, décompte écrit dans le contrôle |
| Contrôle 12 en faux rouge | **[V] ÉTABLIE** — cherchait `polcmd = 'i'`, valeur qui **n'existe pas** ; `insert` vaut `'a'` | ✅ corrigé |
| Contrôles 18 et 19 en faux rouge | **[V] ÉTABLIE** — mesuraient le design **abandonné** de `01400` | ✅ réécrits sur `01600` |
| Nœud texte vide dans un `View` | **[V] ÉTABLIE** — `''` est rendu comme nœud ; `null` et `false` ne le sont pas | ✅ `Boolean()` explicite |
| **`VERIFICATION_RAPIDE.sql` cassé** | **[V] ÉTABLIE** — deux libellés entre guillemets **doubles**, qui désignent un identifiant et non une chaîne. Le script échouait en ligne 384 : **les contrôles 1 à 17 ne s'affichaient plus** | ✅ 2026-09-28 |

---

## Solutions appliquées

| # | Solution | Fichiers |
|---|---|---|
| 1 | `client_id` retiré du client ; trigger `BEFORE INSERT` en `SECURITY DEFINER` | `01600`, `useMissions.ts` |
| 2 | Politique d'insertion des affectations recréée, avec les droits | `01200` |
| 3 | Agents `registered` et `validated` rendus visibles aux clients | `01900` |
| 4 | Jointure `profiles` supprimée de la recherche ; nom lu par fonction | `02000`, `providers.service.ts` |
| 5 | `.select()` retiré de `createMission` **et** de `createAssignment` | `missions.service.ts` |
| 6 | Erreurs techniques journalisées, jamais affichées | `lib/supabase/errors.ts` |
| 7 | Détail technique journalisé **dès l'erreur**, pas seulement au clic « Réessayer » | `search.tsx` |
| 8 | Questions de rendu rendues explicites par `Boolean()` | `search.tsx` |
| 9 | Migrations rendues idempotentes et auto-vérifiées | `01200` et suivantes |
| 10 | `SafeAreaProvider` monté à la racine | `app/_layout.tsx` |
| 11 | `UNION ALL` partout : un `UNION` imbriqué aurait fait perdre la moitié des contrôles | `VERIFICATION_RAPIDE.sql` |
| 12 | Contrôles **20** (droits d'écriture) et **21** (visibilité des prestataires) ajoutés | `VERIFICATION_RAPIDE.sql` |

### La leçon du projet

Sept incidents ont montré que **le code ne peut pas prouver son propre schéma**.
Quatre règles en découlent, et elles s'appliquent à tout contrôle ajouté :

1. **Toute correction de base se valide par exécution**, jamais par lecture de
   fichier. La migration `00600` est parfaitement écrite, et son effet a été
   détruit après coup.
2. **Un diagnostic doit distinguer « protégé » de « non configuré ».** Un `401`
   seul ne prouve rien : il peut signifier que la RLS filtre, ou qu'aucun droit
   n'a été accordé.
3. **Un rapport distingue ce qui est vérifié de ce qui est supposé.** C'est la
   raison d'être des mentions **[V] / [D] / [X]**.
4. **Un contrôle ne peut pas détecter ce qu'il n'attend pas** — et un seuil trop
   lax est aussi trompeur qu'une absence de contrôle.

> Le 2026-09-28, une cinquième variante est apparue : un contrôle qui **ne
> répond plus du tout**. `VERIFICATION_RAPIDE.sql` échouait en ligne 384, et
> l'échec supprimait l'affichage des 17 lignes précédentes. Un contrôle muet se
> lit pourtant comme un contrôle passé : il ne ment pas, il ne répond pas.

---

## Décisions techniques

| Décision | Motif | Statut |
|---|---|---|
| TanStack Query plutôt que `useState` | distinguer « chargement » de « vide », et invalider après écriture | **[V]** appliquée à `missions`, `prestataires`, `villes` |
| `retry: 1` et non 3 | un échec de permission ne se corrige pas en réessayant | **[V]** appliquée |
| Vérifications d'accès en `SECURITY DEFINER` | une sous-requête dans une politique s'exécute avec les droits du **rôle appelant** | **[V]** 6 helpers dans le schéma `private` |
| Retirer `FORCE RLS` de `missions` et `mission_assignments` | `FORCE` soumet le propriétaire aux politiques et casse les `SECURITY DEFINER` | **[V]** `00500` |
| Statuts par RPC uniquement | le client ne doit jamais écrire un statut | **[V]** 8 transitions |
| Villes en liste fermée administrée | évite les variantes orthographiques et les missions hors zone | **[V]** `01100` |
| Erreurs techniques journalisées, jamais affichées | un message PostgreSQL brut révèle tables, politiques et rôles | **[V]** `errors.ts` |
| `client_id` imposé par trigger, pas par le formulaire | empêche de créer une mission au nom d'autrui, et résiste à une politique défaillante | **[V]** `01600` |
| Aucun `.select()` après un `.insert()` | la relecture de `return=representation` échoue, et l'échec est rapporté comme un refus d'écriture | **[V]** appliqué à `createMission` et `createAssignment` |
| Ville dans le formulaire, pas dans la fiche agent | `agent_profiles` n'a qu'un `zone` libre ; on ne fabrique pas une géographie que personne n'a saisie | **[V]** documenté dans `providers.service.ts` |
| Recherche en lecture seule jusqu'à preuve d'écriture | l'écriture n'est validée que sur un seul parcours | **[V]** `providers.service.ts` porte « AUCUNE ÉCRITURE ICI » |
| Contrôles auto-vérifiés dans les migrations | une migration échoue bruyamment plutôt que de laisser passer un demi-correctif | **[V]** `01200` |

### Visibilité réciproque — règle confirmée le 2026-09-28

**« Tout client voit tout prestataire, et réciproquement. »**

**Ce que le schéma fait AUJOURD'HUI, et qui n'est pas la même chose :**

| Sens | État réel | Preuve |
|---|---|---|
| client → prestataire | **partiel** | `[V]` contrôle 21 : politique ouverte, mais **seulement** `registered` et `validated` |
| prestataire → client | **nul** | **[V]** politique `Profiles are viewable by owner or admin` : `id = auth.uid() or is_admin()` |
| prestataire → missions | **uniquement celles qui lui sont affectées** | **[V]** `can_view_mission` exige une affectation existante |

**Deux points ne sont PAS tranchés par cette règle, et ils ne sont pas des détails :**

1. **« Tout prestataire » inclut-il un profil `rejected` ou `suspended` ?**
   Ce serait une absurdité fonctionnelle : le client verrait un agent dont la
   pièce a été refusée, et l'administrateur aurait monté un système de
   validation qui n'empêche rien. La lecture utile est « tout prestataire
   **utilisable** » : `registered` et `validated`.

2. **Jusqu'où va « voir » un client ?**
   `grant select` sur `public.profiles` est accordé **au niveau table**
   (`01800`) : toutes les colonnes sont lisibles, et la RLS filtre les
   **lignes**, pas les colonnes. Ouvrir la politique revient donc à donner à
   chaque prestataire `email` et `phone` de **tous** les comptes clients.

   C'est un problème de protection des données, pas d'architecture. La réponse
   technique n'est pas de fermer la porte, mais de **réduire les colonnes** :
   annuaire par fonction serveur, comme `liste_agents_publics` le fait déjà
   pour les agents.

> ⚠️ **Rien n'est implémenté.** La règle est inscrite, pas appliquée. Voir
> « Points à confirmer » pour les deux décisions qu'elle ouvre.


---

## Variables d'environnement

**[V]** `.env` présent, ignoré par Git. `.env.example` sans valeur.

| Variable | Nature | Utilisée par | État |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | publique | `lib/supabase/client.ts` | ✅ renseignée |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | publique | `lib/supabase/client.ts` | ✅ renseignée |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | publique | cartographie (étape 11) | ⬜ absente |
| `EXPO_PUBLIC_EXPO_PROJECT_ID` | publique | builds (étape 13) | ⬜ absente |
| `STRIPE_SECRET_KEY` | **serveur** | Edge Functions (étape 10) | ⬜ absente — **ne doit jamais être côté mobile** |
| `STRIPE_WEBHOOK_SECRET` | **serveur** | validation des webhooks (étape 10) | ⬜ absente — **idem** |

**[V]** `client.ts` lève une erreur explicite si une variable publique manque.

**[V]** Aucun secret serveur dans le dépôt. La clé `service_role` n'y est pas, et
`README.md` l'interdit explicitement.

---

## Points à confirmer

Éléments jamais inventés, jamais comblés par une supposition.

- **TODO — À CONFIRMER : pays / zone de lancement.** Les 8 villes de `01100`
  sont un exemple, pas une décision.
- **TODO — À CONFIRMER : réglementation applicable et organisme d'agrément.**
- **TODO — À CONFIRMER : prestataire de paiement, taux de commission, frais de
  transaction, délai de libération des fonds.** Bloque l'étape 10.
- **TODO — À CONFIRMER : cartographie.** Google Maps ou Mapbox. Bloque l'étape 11.
- **TODO — À CONFIRMER : modèle d'agent salarié.** Le §Acteurs du plan décrit un
  agent salarié rattaché à une société. **Aucun modèle de données ne le couvre** :
  `agent_profiles` n'a aucun lien vers `company_profiles`. À trancher **avant**
  l'étape 8.
- **TODO — À CONFIRMER : modèle de compte multi-rôle.** Le plan autorise plusieurs
  rôles par compte ; `AuthContext` les lit, mais **aucun parcours ne permet
  d'attribuer un second rôle**, ni de mémoriser l'espace choisi.
- **TODO — À CONFIRMER : mécanisme de vérification de compte.** Aucun écran ni
  service n'existe. Or `01900` rend visible une fiche `registered` : la
  validation par un administrateur est un acte distinct, et l'écran
  correspondant n'est pas construit.
- **TODO — À CONFIRMER : border de `missions.city`.** Clé étrangère vers
  `villes.nom`, ou contrainte applicative ? Décision de sécurité en attente.
- **TODO — À CONFIRMER : périmètre de la visibilité réciproque.** La règle
  « tout client voit tout prestataire, et réciproquement » est confirmée, mais
  deux points restent ouverts :
  1. Un profil prestataire `rejected` ou `suspended` reste-t-il invisible ?
     **Recommandation : oui, invisible.** Le contraire viderait de son sens tout
     l'étape 9 (validation des comptes).
  2. Quelles colonnes d'un profil client un prestataire peut-il lire ?
     **Recommandation : `id`, `full_name`, `role`, `avatar_url` — jamais `email`
     ni `phone`.** Le `grant select` est au niveau table, donc la RLS seule ne
     peut pas protéger ces deux colonnes ; il faut un annuaire par fonction
     serveur.
- **TODO — À CONFIRMER : modèle fermé ou appel d'offres.** Le prestataire ne
  voit que les missions qui lui sont affectées (modèle actuel, sans migration).
  Un tableau de bord public des missions publiées correspond à un **appel
  d'offres**, que le plan liste parmi les fonctionnalités ajoutées après le
  MVP. **Recommandation : modèle fermé pour l'étape 7.**


- **TODO — À CONFIRMER : déplacement de `AuthContext` vers `features/auth/`.**
  Le plan place la logique métier dans `features` ; ne pas le faire sans accord
  explicite.
- **TODO — À CONFIRMER : numérotation `00800` et `01700`.** Absentes de la
  chaîne. Migration supprimée, ou jamais écrite ?

---

## Historique des modifications

| Date | Événement |
|---|---|
| 2026-09-24 | Création du projet, structure initiale, page d'accueil |
| 2026-09-25 | Audit senior : authentification, rôles, services, contrat `Database` |
| 2026-09-25 | `00300_rls_policies.sql` — 32 politiques, 18 grants |
| 2026-09-25 | `00400_state_transitions.sql` — 8 transitions d'état serveur |
| 2026-09-26 | Panne « Accès indisponible / 42501 ». **Cause réelle :** `anon` sans `USAGE` sur le schéma `public` ; l'erreur précédait toute évaluation RLS |
| 2026-09-26 | `00500` : retrait du `FORCE RLS` sur `missions` et `mission_assignments` |
| 2026-09-26 | `00600` : politique `insert` sur `mission_assignments` |
| 2026-09-26 | `00700` : correction des triggers d'inscription, cassés par `FORCE` |
| 2026-09-26 | `000001_reset_all.sql` exécuté **après** `00600` → **P1b**, effet non anticipé |
| 2026-09-26 | Reconstruction complète, `check:supabase` → « conforme » |
| 2026-09-26 | `01100_villes.sql` : référentiel des villes |
| 2026-09-26 | Refonte visuelle : tokens Figma, polices, 6 primitives, accueil client |
| 2026-09-26 | **Premier test runtime** : 3 défauts trouvés — P2 calendrier web, P3 message erroné, P1 création de mission |
| 2026-09-26 | S1 à S9 : typographie, `AppHeader`, onglets Material, branche web, `errors.ts`, cycle `villes`, doublon de service, contrats trop permissifs |
| 2026-09-26 | `01200` et `01300` écrits, non appliqués |
| 2026-09-26 | Analyse exhaustive (69 fichiers) et réécriture du rapport. Ancien rapport conservé dans `docs_RAPPORT_HISTORIQUE_2026-09-26.md` |
| 2026-09-27 | `01500` appliquée : **la sonde de diagnostic est retirée de la production** |
| 2026-09-27 | `01600` appliquée : trigger `BEFORE INSERT` sur `missions.client_id`. **`01400` abandonnée** |
| 2026-09-27 | `01800` : restauration des droits sur les fiches prestataires |
| 2026-09-27 | `01900` : les agents deviennent visibles par les clients. **`02000`** : annuaire et `liste_agents_publics` |
| 2026-09-27 | **Première validation fonctionnelle** : mission créée, fiche agent créée et modifiée, agent retrouvé par un client |
| 2026-09-28 | **Diagnostic complet du dépôt.** `typecheck`, `lint` et `npx eslint .` verts. Base distante mesurée : **19 contrôles sur 19 au vert** à ce stade |
| 2026-09-28 | **`VERIFICATION_RAPIDE.sql` réparé** : deux libellés en guillemets doubles rendaient le script inexécutable depuis le 27/09 à 23h52. Le plan des 14 étapes est reçu et versé au dépôt |
| 2026-09-28 | `createAssignment` : `.select()` retiré, cohérent avec `createMission` |
| 2026-09-28 | Contrôles **20** (droits d'écriture sur les affectations) et **21** (visibilité des prestataires) ajoutés |
| 2026-09-28 | **Contrôles 20 et 21 exécutés : 21 sur 21 au vert.** Le parcours d'affectation a désormais toutes ses fondations mesurées. **Aucun sixième défaut trouvé.** |
| 2026-09-28 | `RAPPORT_PROJET.md` **réécrit intégralement** : contradictions internes supprimées, sections alignées sur le plan, inventaire mesuré |
| 2026-09-28 | **ÉTAPE 6 (suite) — réservation codée** : bouton « Publier », `useAssignments`, `listerAffectationsMission` (sans imbrication), écran `(client)/prestation/[id]`. `typecheck`, `lint`, `eslint` et `expo export` verts. **Non testée à l'écran** |
| 2026-09-28 | Deux décisions de prudence levées : `CartePrestataire` devient actionnable, et son commentaire « AUCUNE ACTION ICI » — devenu faux — est remplacé |
| 2026-09-28 | **TEST FONCTIONNEL RÉUSSI.** Parcours complet client : publier → réserver. 2 affectations `pending` créées sur des missions `published`. `publish_mission` et `createAssignment` passent pour la première fois |
| 2026-09-28 | `23505` traduit dans `errors.ts` et doublon bloqué avant le clic : un index unique interdit la double réservation, et rien ne le disait à l'écran |
| 2026-09-28 | **DÉFAUT 6 trouvé** : `company_profiles` fermée aux clients. **La recherche n'a jamais affiché une société**, et le test du 27/09 l'a manqué parce qu'il cherchait un agent. Migration `20260928002100` écrite : ouvre les sociétés ET ajoute `prestataires_par_ids`. Contrôle 22 ajouté |
| 2026-09-28 | **Étape 7 + dernier jalon de l'étape 6 codés** : écran agent (voir / accepter / refuser), écran de suivi client, `CarteAffectation` partagé, `Card` rendu actionnable. `typecheck`, `eslint` et `expo export` verts. **Non testés à l'écran** |
| 2026-09-28 | `mission/new` déclaré dans le `_layout` client avec `href: null` : il apparaissait comme un onglet fantôme depuis l'origine |
| 2026-09-28 | **Migration `20260928002100` APPLIQUÉE.** Contrôle 22 au vert : sociétés lisibles, `FORCE` actif sur les 2 tables, fonction publique présente. Contrôle 4 toujours à 37 — la politique a **remplacé** l'ancienne. **22 contrôles sur 22** |

---

## Méthode de vérification

Aucune étape n'est déclarée terminée sans exécution. Les quatre commandes à
lancer avant de dire « c'est fini » :

```bash
npm run typecheck      # doit être vide
npm run lint           # doit être vide
npx eslint .           # tout le dépôt, scripts/ inclus
npm run check:supabase # doit dire « RESULTAT : conforme »
```

Et, pour la base, `supabase/verification/VERIFICATION_RAPIDE.sql` dans le SQL
Editor : **21 lignes, 0 `ALERTE`**.

> Un vert sur `check:supabase` ne vaut pas validation fonctionnelle. Le script
> teste le rôle `anon` et ne dit **rien** de ce qu'un utilisateur connecté voit.
> Seul un test à l'écran, avec un vrai compte, prouve qu'un parcours marche.
