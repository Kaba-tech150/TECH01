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
> Session en deux temps. Le matin : remise en route de la vérification. L'après-midi :
> dix défauts, dont quatre migrations.
>
> 1. `VERIFICATION_RAPIDE.sql` était **cassé depuis le 27/09 à 23h52** et ne
>    pouvait plus rien vérifier. Corrigé, puis étendu — d'abord 21, puis **26
>    contrôles**, tous au vert.
> 2. **Dix défauts** trouvés et corrigés. Trois vus par le commanditaire à l'écran,
>    un trouvé par le script de diagnostic **lui-même**.
> 3. Le plan des 14 étapes a été fourni. Il n'existait nulle part dans le dépôt :
>    les « étapes 7 à 13 » citées jusqu'ici n'étaient invérifiables par personne.
>
> **Aucun des dix défauts n'était détectable par un contrôle d'état.** Ils
> étaient dans ce que la base **fait**, pas dans ce qu'elle **contient**.

---

## État actuel

**Le code des parcours client et agent est complet. Le parcours agent n'a pas
été ouvert une seule fois.**

| Domaine | État | Preuve |
|---|---|---|
| Socle technique | ✅ Opérationnel | **[V]** `tsc --noEmit` vide · `npx eslint .` exit 0 |
| **Design system** | ⚠️ **Socle refait, 2 écrans sur 11** | **[V]** identité « SecuGuard Enterprise » appliquée aux tokens, aux 6 primitives, à l'en-tête et à la navigation · **[V]** accueil agent et exécution de mission reconstruits · **[X]** aucun des deux revu à l'écran |
| Base Supabase | ✅ **Saine** | **[V]** **26 contrôles sur 26 au vert** · `check:supabase` conforme |
| Sécurité de la base | ✅ Sonde retirée | **[V]** contrôle 17 = `0` |
| Authentification | ✅ **Validée** | **[V]** `getUser()` serveur, profil et rôles chargés |
| **Parcours client** | ⚠️ **Codé** | **[V]** demande, recherche, publication, réservation, suivi, clôture · **[X] clôture jamais testée |
| **Fiche agent** | ✅ **Fonctionnelle** | **[V]** création et modification depuis l'écran, valeurs en base |
| **Parcours agent** | ⚠️ **Codé** | **[V]** exécution de mission écrite et routée · **[X] aucun écran ouvert à ce jour |
| Espaces société / admin | ❌ **Écrans vides** | **[V]** aucune requête de donnée |
| **Routage** | ✅ **Désambiguïsé** | **[V]** 22 URL publiques, **0 doublon** · `/profile` et `/missions` n'existent plus |
| **Étape 12 — qualité** | ⚠️ **amorcée, bloquée** | **[V]** `test:parcours` écrit · **[V]** `.env.test` incomplet (3 valeurs sur 4 vides, constaté le 2026-09-29) · **[X]** jamais exécuté |

---

## Défaut 11 — quatre fichiers pour une seule URL (2026-09-30)

**Constaté par le commanditaire**, en ouvrant `http://localhost:8081/profile`
et en obtenant un écran absent.

### Ce que c'était

En Expo Router, **un groupe entre parenthèses n'entre pas dans l'URL**. Quatre
frais de nom suffisaient donc à produire la même adresse publique :

| Fichier (avant) | URL publique | Espace |
|---|---|---|
| `(client)/profile.tsx` | `/profile` | client |
| `(agent)/profile.tsx` | `/profile` | agent |
| `(company)/profile.tsx` | `/profile` | société |
| `(admin)/profile.tsx` | `/profile` | admin |

Le même défaut existait sur `/missions` (4 fichiers) et `/mission/[id]` (2
fichiers). **La table de routes générée déclarait `/profile` quatre fois** —
c'est elle qui a permis de le voir, et non la lecture des écrans.

À l'ouverture de `/profile`, le routeur élisait un vainqueur arbitraire. Si le
rôle de l'utilisateur ne correspondait pas, `ProtectedRoute`
(`src/components/auth/ProtectedRoute.tsx:93`) le redirigeait vers
`/(auth)/role-selection` : d'où l'écran « absent ».

**Ce que cela ne cassait pas :** la navigation interne. Les 12 `router.push`
portaient tous le groupe (`/(client)/profile`), et les onglets fonctionnaient.
**Seule la saisie manuelle d'URL, et donc le partage de lien, était en cause.**

### Aucune des trois vérifications obligatoires ne l'aurait vu

`tsc --noEmit` passe, et il passerait encore : `typedRoutes` valide la **forme**
d'une chaîne, pas son **unicité**. `/(client)/profile` est une chaîne
parfaitement valide. C'est le onzième défaut de la même famille que les dix du
28 septembre — dans ce que la base **fait**, pas dans ce qu'elle **contient**.

### Correction — option A, suffixes d'espace **[V]**

Les noms de fichiers portent désormais l'espace, donc l'URL aussi. Les groupes
sont conservés : ils portent les gardes `ProtectedRoute` et les `Tabs`.

| Avant (URL) | Après (URL) |
|---|---|
| `/profile` (×4) | `/profil-client` · `/profil-agent` · `/profil-societe` · `/profil-admin` |
| `/missions` (×4) | `/missions-client` · `/missions-agent` · `/missions-societe` · `/missions-admin` |
| `/mission/[id]` (×2) | `/mission-suivi/[id]` · `/mission-execution/[id]` |

**24 occurrences** de routes mises à jour dans 9 fichiers, plus **10**
`Tabs.Screen` dans les 4 layouts. Les renommages ont été faits par `git mv` :
git les enregistre comme renommages, pas comme suppressions.

### Preuves **[V]**

- `tsc --noEmit` vide · `npx eslint .` exit 0 · `check:supabase` conforme.
- **Zéro référence résiduelle** aux anciennes routes, recherche sur `src/`.
- **Table de routes régénérée** : 22 URL publiques, **0 doublon**. `/profile`,
  `/missions` et `/mission/[id]` ont **disparu** de la table.

### Le cache Metro a menti une fois de plus **[V]**

Le premier relevé de la table de routes, après les renommages, affichait
**encore** `/profile` et `/missions` **et** les nouveaux noms. Fichier daté de
03:43:50, soit avant les renommages : c'était un cache périmé, pas la vérité.
Le fichier ne se régénère qu'au démarrage du serveur de dev — le supprimer ne
suffit pas, il faut relancer `expo start`. Après redémarrage, le fichier est
passé de 16 009 à 12 069 octets et ne contient plus que les nouveaux noms.

> C'est le même piège que celui du manifeste PWA, documenté plus bas : un vert
> sur `typecheck` + `eslint` n'aurait jamais vu ce défaut, et un cache
> périmé aurait pu faire croire qu'il n'était pas corrigé.

### Ce qui reste à faire **[X]**

**Aucun écran renommé n'a été rouvert à l'écran.** `typecheck`, `eslint` et la
table de routes prouvent que les routes sont uniques et cohérentes — pas qu'un
onglet affiche le bon contenu. C'est la limite que ce projet s'est donnée dès le
premier défaut.

---

## Identité visuelle — « SecuGuard Enterprise » (2026-09-29)

Le design livré dans `design/` remplace l'identité précédente. **Lot 1
terminé : le socle est refait, les 11 écrans maquettés ne le sont pas encore.**

### Combien d'écrans, en fait **[V]**

Compté sur le code, pas estimé.

| | Nombre | Détail |
|---|---|---|
| **Écrans réels** | **27** | fichiers de route dans `src/app`, hors `_layout` et `+not-found` |
| **Maquettes d'écrans** | **11** | 10 dans `stitch/` + `paramettre` à la racine |
| **Routes couvertes par une maquette** | **7** | voir tableau ci-dessous |
| **Routes sans maquette** | **19** | différées |
| **Maquettes sans route** | **2** | 2FA et évaluation, à créer en visuel pur |
| **Écrans reconstruits** | **2** | accueil agent, exécution de mission · 9 restent |

| Maquette | Route réelle | Lot |
|---|---|---|
| `splash_screen` | *aucune* — `app.json` + `StartupGate` | 2A |
| `bienvenue_onboarding` | `(startup)/onboarding` | 2A |
| `onboarding_pr_sentation` | `(startup)/onboarding` — même route, 2e et 3e slides | 2A |
| `authentification_2fa` | *aucune* — **à créer** | 3 |
| `connexion` | `(auth)/sign-in` | 2B |
| `cr_ation_de_compte` | `(auth)/sign-up` | 2B |
| `r_server_et_payer` | `(client)/mission/new` | 2C |
| `ex_cution_mission_agent` | `(agent)/mission/[id]` | **2C — reconstruit** |
| `revenus_historique_agent` | `(agent)/index` | 2C |
| `valuer_le_service` | *aucune* — **à créer** | 3 |
| `paramettre` | `(client)/profile` | 2D |

**Trois pièges dans ce décompte**, qui expliquent les « 10 » antérieurs :

1. `stitch/secuguard_authentification_2fa/` **n'existait pas** comme HTML
   racine : à la racine il n'y a que `authentification_2fa.png`, **sans HTML**.
   Le PNG seul a fait perdre une maquette à chaque inventaire précédent.
2. `stitch/secuguard_enterprise/` **ne contient qu'un `DESIGN.md`** — ni HTML ni
   PNG. Ce n'est pas un écran, c'est la documentation du design system. En le
   comptant, `stitch` annonçait 11 dossiers pour 10 écrans : c'est de là que
   venait le compte « 10 », et il était juste **par accident**.
3. `design/code.html` est la **galerie de composants** de Stitch, pas un écran.

`paramettre` n'existe que à la racine, pas dans `stitch`. Enfin,
`(client)/index` a été restylé au lot 1 **sans avoir de maquette** : c'est de
la mise en conformité au socle, pas une reconstruction.

### Règle de lecture du design

`design/DESIGN.md` se contredit sur deux points : son bloc YAML déclare
`primary: #000000`, le texte juste en dessous annonce « Primary #0F172A »,
et ni l'un ni l'autre n'apparaît dans les rendus. **Quand `DESIGN.md` et les
maquettes divergent, la maquette l'emporte** : le PNG et le HTML sont
cohérents entre eux, le texte ne l'est pas.

### Ce qui est vérifié **[V]**

Relevé sur le `tailwind.config` embarqué dans chaque maquette, puis posé dans
`src/constants/index.ts`.

| Token | Identité précédente | Identité « SecuGuard » |
|---|---|---|
| `background` | `#FAFAFF` | **`#FCF8FA`** |
| `surfaceContainerHigh` | `#E3E7FF` | **`#EAE7E9`** |
| `primary` (actions) | `#00677F` teal | **`#000000`** noir |
| `primaryContainer` (navy) | `#022E43` | **`#131B2E`** |
| `accent` | `#F79009` | **`#F59E0B`** |
| `accentSurface` | *inexistant* | **`#FCDEB5`** |
| `text` | `#101828` | **`#1B1B1D`** |
| `textSecondary` | `#475467` | **`#45464D`** |
| `border` | `#E4E7EC` | **`#C6C6CD`** |
| `error` | `#C62828` | **`#BA1A1A`** |
| `success` | `#027A48` | **`#1F6F45`** |
| `BORDER_RADIUS.lg` | 16 | **12** |
| Titres | Plus Jakarta Sans | **Hanken Grotesk 600/700** |
| Texte courant | Manrope | **Plus Jakarta Sans 400/500** |

**La paire de polices est inversée.** Hanken Grotesk porte désormais tout ce
qui est titre, libellé ou bouton ; Plus Jakarta Sans le texte courant. Manrope
a été désinstallé.

**Sur le splash, j'ai retiré l'image.** `expo-splash-screen` configurait un
`image` de 76 px sur fond `#208AEF`. Le fond est passé au navy `#131B2E` et le
logo a été retiré : l'application affiche désormais un aplat navy nu. Le logo
de la maquette reste **à produire** — `assets/images/splash-icon.png` est
désormais inutilisé, et l'absence d'image n'est pas un choix esthétique
défendable, c'est un manque.

### Le point qui n'est pas une question de goût

**La couleur de marque est passée du teal `#00677F` au noir `#000000`.** Dans
la maquette, les boutons d'action sont noirs et le teal n'apparaît nulle part.
Le bleu ne survit que comme teinte de fond froide (`primaryLight` `#DAE2FD`,
`secondaryContainer` `#D5E3FD`). Conséquence : l'onglet inactif est redevenu
gris, et non plus « bleu atténué ». C'est une régression visuelle **voulue**,
pas un oubli.

### Deux points vérifiés **[V]**

**Le manifeste PWA gardait l'ancienne identité — défaut trouvé en construisant.**

`npx expo export` avait réussi du premier coup, `tsc` et `eslint` étaient
verts, et le bundle contenait malgré tout :

```
"name":"secu", "shortName":"secu", "backgroundColor":"#208AEF"
```

L'`app.json` ne déclarait **aucun** `expo.web.name`, `shortName`,
`backgroundColor` ni `themeColor` : le manifeste héritait de valeurs
précédentes. Le nom affiché dans l'onglet du navigateur, le nom de
l'application installée et la couleur de fond du splash navigateur étaient
restés ceux de « secu ». Corrigé dans `app.json`, puis vérifié dans le bundle
reconstruit : `#208AEF` est passé de 1 occurrence à **0**.

**Un cache Metro resservait la configuration périmée.** Après la correction,
l'export produisait *encore* l'ancien `app.json` — fichier au hash identique
à l'export précédent, malgré la suppression de `dist-web/` et de `.expo/`.
`npx expo config --clear` **n'existe pas** en Expo 57 (option refusée par
`node`). La purge se fait avec `npx expo export --clear`, qui vide le cache
Metro. **Un vert sur `typecheck` + `eslint` n'aurait jamais vu ce défaut.**

**Le `scheme` ne casse rien.** Recherche récursive dans `src/` : aucun
`signInWithOAuth`, `signInWithOtp`, `getOAuthSignInUrl`, `redirectTo` ni
`Linking.openURL`. L'application n'a aucune redirection OAuth, il n'y avait
donc rien à mettre en cohérence avec `secuguard://`. **Si Google ou Apple est
ajouté un jour**, c'est à ce moment-là qu'il faudra inscrire `secuguard://`
dans les Redirect URLs du tableau de bord Supabase — pas avant.

**Un défaut préexistant, non corrigé.** `_layout.tsx:40` masque le splash dès
que les polices sont chargées, et `StartupGate.tsx:48` le masque de nouveau
après la session. Le premier `hideAsync` l'emporte : le splash disparaît
avant que la session soit connue, alors que le rapport historique annonçait
l'inverse. **Ce n'est pas une régression de ce lot** — le diff de
`_layout.tsx` ne touche pas ce `useEffect` — mais c'est un écart entre ce
qui est écrit et ce qui est fait.

### Les assets étaient ceux du template Expo **[V]**

Aucun `typecheck`, aucun `eslint` et aucun export ne pouvait le voir : ce sont
des fichiers, et ils n'étaient pas faux, ils étaient **à côté**.

- `icon.png` pesait 799 Ko et représentait l'icône par défaut d'Expo — un « A »
  bleu — et non SecuGuard. C'est aussi l'image **utilisée dans `AppHeader`**,
  sur un en-tête clair : l'application affichait un bloc bleu à son sommet.
- `splash-icon.png` faisait 3317 octets, exactement la taille de
  `expo-logo.png` : c'était le logo Expo. Le retirer au lot 1 était donc
  justifié, mais il fallait le remplacer.
- `react-logo*`, `expo-badge*`, `tutorial-web.png`, `logo-glow.png` et
  `tabIcons/` (6 fichiers) étaient **orphelins** : zéro référence dans `src/`
  et dans `app.json`. `tabIcons/` datait du passage à `MaterialCommunityIcons`.
- `assets/expo.icon/` était un dossier Icon Composer d'Expo, référencé comme
  icône iOS.

**Le logo est produit**, pas emprunté : bouclier et coche en ambre pâle
`#FCDEB5` sur navy `#131B2E`, dessinés par `scripts/generer-logo.ps1` à partir
des mêmes constantes que `src/constants`. Sept fichiers produits, dont
`secuguard-mark.png` sur fond transparent — c'est celui-là qu'`AppHeader`
affiche, parce qu'une icône à fond navy sur un en-tête clair donne un bloc
sombre. Le monochrome est blanc, pour l'icône adaptative Android.

L'en-tête affichait aussi le nom **`Secu`**. Il affiche maintenant `SecuGuard`,
et `package.json` ne s'appelle plus `secu` non plus. `dist-web/` a été supprimé
et ajouté au `.gitignore` : il n'y était pas, il aurait été commité.

**Limite à connaître : ni le splash ni l'icône ne sont visibles sous Expo Go.**
`expo-splash-screen` et les icônes ne s'appliquent qu'à un *development build*
ou un build de production. Expo Go affiche son propre écran de démarrage. Ce
qui **est** vérifiable sous Expo Go : palette, polices, composants, navigation.

### Ce qui reste à faire **[X]**

**2 des 11 écrans maquettés sont reconstruits** : l'accueil agent et
l'exécution d'une mission. Les 9 autres ne le sont pas.

Aucun des deux n'a été revu à l'écran : `typecheck`, `eslint` et
`expo export` ne disent rien du rendu. C'est la limite que ce projet s'est
donnée dès le premier défaut.

---

## Étape en cours

### ÉTAPES 6 ET 7 — PARCOURS COMPLET ÉCRIT, **RIEN N'EST VÉRIFIÉ À L'ÉCRAN**

Session du **2026-09-28**, deuxième partie. La première partie avait validé la
demande, la recherche, la publication et la réservation.

| Domaine | Écrit | Vérifié à l'écran |
|---|---|---|
| Étape 6 — parcours client | **complet** | jusqu'à la réservation seulement |
| Étape 7 — parcours agent | **complet** | **[X] aucun écran ouvert à ce jour |

**C'est le seul obstacle qui reste**, et il n'est pas dans le code.

### Ce que la session a produit

| Élément | Preuve |
|---|---|
| Pointage d'arrivée et de départ | **côté agent**, jamais ouvert |
| Rapport joint au départ | `pointer_depart(affectation, p_rapport)` |
| Écran de disponibilité | `is_available` |
| `cloturer_mission` | migration `20260928002400` |
| `scripts/test-parcours.js` | 13 étapes, 5 cas négatifs, **[X] jamais exécuté** |

### Les dix défauts

Trois ont été vus **par le commanditaire**, pas par un contrôle : la mission
« Terminée » pendant que l'affectation disait « Acceptée », un pointage en
`HTTP 405`, et un diagnostic qui s'accusait lui-même.

**Aucun des dix n'était détectable par un contrôle d'état.** Voir
*Problèmes rencontrés*.

---

## Étapes terminées

| Étape | Statut | Nature de la validation |
|---|---|---|
| 0 — Environnement | ✅ | **[V]** Node 24.15.0, npm 11.12.1, Expo 57.0.25, Router 57.0.23, TypeScript 6.0.3 |
| 1 — Architecture | ✅ | **[V]** structure conforme au plan, design system, `RAPPORT_PROJET.md` |
| 2 — Page d'accueil | ✅ | **[V]** `welcome.tsx`, export web, polices chargées avant le splash |
| 3 — Supabase | ✅ | **[V]** 26 contrôles au vert · **écriture testée à l'écran** |
| 4 — Authentification | ✅ | **[V]** inscription, connexion, session persistante, rôles |
| 5 — Routing par rôle | ✅ | **[V]** les 4 groupes rendent, `ProtectedRoute` par rôle |
| 6 — Parcours client | ⚠️ **codé** | **[V]** demande, recherche, publication, réservation · **[X] suivi et clôture non testés |
| 6 bis — Fiche agent | ✅ | **[V]** création **et** modification, valeurs en base |
| 6 ter — Recherche | ✅ | **[V]** agent retrouvé par un compte client |
| 7 — Parcours agent | ⚠️ **codé** | **[X] aucun écran ouvert |
| 12 — Qualité | ⚠️ **amorcée, bloquée** | **[V]** `test:parcours` écrit · **[V]** `.env.test` incomplet · **[X]** jamais exécuté |

> Les étapes 6 et 7 sont marquées « codé », pas « terminée ». **Du code non
> exécuté n'est pas une fonctionnalité**, et l'étape 6 l'a déjà démontré : elle
> était couverte par des contrôles verts et le parcours était cassé trois fois.

---

## Prochaine étape

### Lancer `test:parcours`, puis ouvrir les écrans de l'étape 7

**C'est la seule chose qui bloque.** Tout le reste est écrit.

**État constaté le 2026-09-29 [V]** — `.env.test` existe, est ignoré par git
(`.gitignore:36`), mais n'est pas renseigné :

| Clé | État |
|---|---|
| `TEST_CLIENT_EMAIL` | vide |
| `TEST_CLIENT_PASSWORD` | vide |
| `TEST_AGENT_EMAIL` | renseignée |
| `TEST_AGENT_PASSWORD` | vide |

Le test n'a **pas** été lancé : un mot de passe ne se devine pas, et aucun
n'a été inventé. Le script s'arrête sur `CONFIGURATION INCOMPLETE` avant sa
première étape **[D]** — cette sortie n'a pas été observée, la commande n'ayant
pas été exécutée.

**À faire par le commanditaire :** renseigner les trois valeurs vides, avec deux
comptes **distincts** et **jetables**. Le test crée une mission par exécution et la
clôture ; une mission close ne se rouvre pas, et aucune politique de
suppression côté client n'existe. Le compte agent doit avoir une fiche
`agent_profiles` complète, sinon le test s'arrête à l'étape 0.

**1. Le test automatique** — 3 valeurs à renseigner dans `.env.test`, puis :

```bash
npm run test:parcours
```

Il joue le parcours avec deux comptes réels et **cinq cas négatifs** — clore
une mission qui n'a pas commencé, partir sans être arrivé, clore avant le
départ, departure répétée, clôturer deux fois. Ces cinq transitions **n'ont
jamais été essayées**.

**2. Les écrans de l'étape 7** — le test joue la base, pas React Native.
Le parcours agent reste non vérifié même si le test est vert.

**Ce que `test:parcours` ne couvre pas [V, par lecture du script] :**
l'écriture directe sur `report` (`enregistrerRapport`) avant le départ. Le script
ne fait passer le rapport que par `pointer_depart`. Le droit est mesuré par le
contrôle 23 (état des `grant`), mais **l'écriture elle-même n'a jamais été
exécutée**. Elle demande un test à part ou l'ouverture de l'écran.

**Ce qu'il faut ouvrir, dans cet ordre, avec une session agent réelle :**

1. `(agent)/missions` — la liste, et `accept_assignment` / `reject_assignment`,
   **jamais exécutées** ;
2. `(agent)/mission/[id]` — l'écran d'exécution, **atteignable mais jamais
   rendu** : chrono, consignes, rapport, pointage d'arrivée puis de départ ;
3. `(agent)/index` — l'accueil reconstruit, dans ses trois états.

Le premier écran à ouvrir est le second : c'est là que se trouvent les quatre
fonctions de transition que personne n'a jamais vues répondre.

**3. Ensuite seulement**, les décisions métier : missions publiées côté agent,
modèle fermé ou appel d'offres, annuaire réciproque, visibilité de l'adresse.

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

**[V]** 23 fichiers : `000001_reset_all.sql` (destructif) et 22 migrations datées
`20260925000100` à `20260928002400`.

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
| `02100` | sociétés visibles par les clients, `prestataires_par_ids` |
| `02200` | **matrice réparée** : `accepted` avait aucune sortie · `pointer_arrivee`, `pointer_depart` |
| `02300` | pointages **redeclares `volatile`** — voir défaut 8 |
| `02400` | `cloturer_mission` : mission **et** affectations, en une opération |

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
| `VERIFICATION_RAPIDE.sql` | **26 contrôles**, un seul `SELECT`, un seul verdict |
| `VERIFICATION_POST_MIGRATION.sql` | 19 contrôles détaillés, un par un |
| `LISTE_POLITIQUES.sql`, `DIAGNOSTIC_ETAT.sql`, `ETAT_DROILS_AGENT.sql` | diagnostics |
| `MIGRATIONS_EN_ATTENTE.md` → *ÉTAT DE LA BASE* | ✅ **à jour** — 26/26, aucune migration en attente |
| `GUIDE_APPLICATION_MIGRATIONS.md`, `RECONSTRUCTION_BASE.md` | ⛔ **périmés**, bandeau d'avertissement en tête |

> ⚠️ **`MIGRATIONS_EN_ATTENTE.md` prescrivait d'appliquer `01200`, déjà
> appliquée.** Le 2026-09-28 il a été réécrit : il annonçait un défaut qui
> n'existait plus, et ignorait les quatre migrations du jour. **Vérifié le
> 2026-09-28.**
>
> Un document périmé qui renvoie à un document périmé est un piège à deux
> étages. Les deux fichiers portaient un bandeau « ⛔ PÉRIMÉ » correct — mais
> tous deux renvoyaient vers celui-ci **en le croyant à jour**. C'est lui qui
> mentait. La chaîne entière devait être revue, pas seulement la feuille.

### Machines à états

**[V]** 11 RPC `SECURITY DEFINER`, accordées à `authenticated` et révoquées pour
`anon`. Le client n'écrit **jamais** un statut.

**Mission** — `draft`, `published`, `accepted`, `in_progress`, `completed`,
`cancelled`, `disputed`, `paid`

| Transition | RPC |
|---|---|
| publier | `publish_mission` |
| annuler | `cancel_mission` |
| clôturer **(mission + affectations)** | `cloturer_mission` |
| marquer payée | `mark_mission_paid` |
| ouvrir un litige | `open_mission_dispute` |

> `complete_mission` existe toujours dans le catalogue, mais **plus rien ne
> l'appelle**. Elle ne fait avancer que la mission : c'est exactement ce qui
> laissait le client avec « Terminée » sur le badge et « Acceptée » sur
> l'affectation. `cloturer_mission` la remplace et fait les deux dans la même
> opération.

**Affectation** — `pending`, `accepted`, `rejected`, `completed`

| Transition | RPC |
|---|---|
| accepter | `accept_assignment` |
| refuser | `reject_assignment` |
| terminer | `complete_assignment` — **jamais appelée** |
| **pointer l'arrivée** | `pointer_arrivee` — fait aussi passer la mission `in_progress` |
| **pointer le départ** | `pointer_depart` — emporte le rapport, **ne clôture rien** |

> `complete_assignment` exige l'**agent affecté** comme acteur, donc le client ne
> peut pas l'appeler. C'est pourquoi `cloturer_mission` fait le travail des deux
> côtés, et pourquoi l'affectation ne peut plus rester `accepted` après la
> clôture de la mission.
>
> `pointer_depart` ne clôture pas la mission : c'est une **décision métier**.
> L'agent termine SA vacation, le client — seul juge de ce qui a été fait —
> confirme. Un agent qui pourrait clore pourrait le faire avant l'heure, et le
> temps facturé s'arrêterait.

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

**6 gestionnaires `onPress={() => {}}` restants, et 2 écrans « Bientôt
disponible ».**

*Décompte refait le 2026-09-29 par recherche sur l'ensemble du dépôt. Le
tableau précédent annonçait 10 gestionnaires et 3 écrans « Bientôt
disponible » : il était périmé, et les trois écrans agent qu'il citait
(`index`, `missions`, `availability`) sont en réalité implémentés et
interrogent la base.*

| Écran | Constat |
|---|---|
| `(company)/index.tsx` | 2 boutons vides |
| `(company)/missions.tsx` | 1 bouton vide |
| `(company)/team.tsx` | 1 bouton vide |
| `(admin)/index.tsx` | 2 boutons vides |
| `(admin)/users.tsx` | « Bientôt disponible » |
| `(admin)/missions.tsx` | « Bientôt disponible » |
| 2 × `profile.tsx` (company, admin) | statiques |

> **Aucune requête de données** dans les espaces société et administrateur.
> L'espace agent est le seul à être entièrement relié.

### Accueil agent reconstruit — 2026-09-29

`src/app/(agent)/index.tsx` a été reconstruit depuis
`design/secuguard_accueil_agent_ind_pendant.html`. Il ne contient plus aucun
gestionnaire vide.

**Vérifié `[V]` :**

| Point | Preuve |
|---|---|
| Le fichier compile | `npx tsc --noEmit` vide |
| Le code est conforme aux règles | `npx eslint .` vide, dépôt entier |
| Le schéma est intact | `check:supabase` : `RESULTAT : conforme` |
| Aucune donnée en dur | tous les compteurs viennent d'une lecture |

**Écrans alimentés par la base :**

| Bloc | Source |
|---|---|
| Identité, zone, agrément | `profiles`, `agent_profiles.zone`, `certification_number` |
| Demandes, terminées, reçues | `mission_assignations` filtrées par statut |
| Vacation en cours | `accepted` **avec** `check_in_time` et **sans** `check_out_time` |
| Solde et séquestre | `wallets.balance`, `wallets.blocked_balance` |
| Tarif horaire | `agent_profiles.hourly_rate`, masqué s'il est nul |
| Bascule de disponibilité | mutation `useChangerDisponibilite` |

**Écarts assumés avec la maquette `[V]` :**

La maquette est un poste de supervision ; l'application est une place de
marché. Les blocs suivants ont été **retirés plutôt que simulés**, parce que le
modèle ne contient aucune donnée capable de les remplir :

- « NFC », « Waze », « Astreinte », « 14 PC de sécurité » ;
- « Cumul net avant prélèvement » et « Taux horaire moy. » — supposeraient une
  règle de commission, qui relève de l'étape 10 ;
- le montant « 220 € » des missions en direct, affiché **uniquement** si
  `proposed_rate` le porte.

`missions.budget` est un budget global saisi par le client, pas un prix ferme :
l'utiliser comme montant affiché porterait déjà une décision de facturation
qui n'est pas prise.

**Supposé `[X]`, non vérifié :**

- **Le rendu à l'écran de cet accueil n'a pas été exécuté.** Les vérifications
  sont statiques. Un écran peut compiler, passer le lint, et planter au premier
  rendu sur une donnée de forme inattendue.
- Il faudra une **session agent réelle** pour valider l'affichage des trois
  états : compte sans fiche, compte avec fiche, compte avec demandes en attente.
- L'écran **affiche que** `wallets` est en lecture seule. Il n'a aucun moyen de
  modifier un solde, et le dit à l'écran plutôt que d'exposer un bouton
  inopérant.

---

### Exécution de mission par l'agent — 2026-09-29

`src/app/(agent)/mission/[id].tsx`, reconstruit depuis
`design/secuguard_ex_cution_mission_agent.html`. Le fichier était **resté à
moitié écrit** — il s'arrêtait sur un marqueur `//__SUITE__`, au milieu d'un
JSX non fermé. `tsc` et `eslint` le signalaient depuis le début de la session ;
il n'avait jamais été exécuté.

**Vérifié `[V]` :**

| Point | Preuve |
|---|---|
| Le fichier compile | `npx tsc --noEmit` vide |
| Le code est conforme aux règles | `npx eslint .` vide, dépôt entier, **0 avertissement** |
| La route se construit et se pré-rend | `npx expo export` → `/(agent)/mission/[id] (25KB)` |
| L'écran est atteignable | bouton « Ouvrir le poste » (accueil), « Ouvrir la mission » (liste) |
| Ce n'est pas un onglet fantôme | `href: null` déclaré dans `(agent)/_layout.tsx` |

**Ce qui vient de la base :**

| Bloc | Source |
|---|---|
| État du poste et chrono | `check_in_time`, `check_out_time` — le chrono est **figé** au départ |
| **Durée prévue `/ 10h00`** | `end_time - start_time` du client, avec « · dépassée » si l'arrivée est postérieure à la fin |
| Identité, adresse, créneau | mission imbriquée dans `getAgentMissions()` |
| Statut de la mission | imbriqué — c'est le seul endroit où l'agent voit que son pointage l'a fait passer `in_progress` |
| **Journal de vacation** | `created_at`, `check_in_time`, `check_out_time` — les 3 seuls horodatages existants |
| **Consignes du client** | `description` + `special_requirements`, réunies et remontées, liseré ambre |
| Rapport | `mission_assignments.report`, en modification pendant la vacation |
| Zone et tarif | `agent_profiles`, **sans aucun montant calculé** |

**Trois décisions, et leurs raisons :**

1. **Aucune migration n'a été nécessaire.** `description` et
   `special_requirements` manquaient à la sélection de `getAgentMissions` : ce
   n'était pas un droit absent. `grant select` sur `missions` est au niveau
   table, et `private.can_view_mission` ouvre la mission à l'agent affecté dès
   `pending`. **La RLS filtre des lignes, pas des colonnes.**
2. **Le rapport peut être enregistré avant le départ.** C'est la seule écriture
   directe d'un écran dans ce projet, et elle porte sur `report` seul : la
   colonne est dans le `grant update` de `00300`, la politique « Assigned agents
   can update mission reports » n'ouvre la ligne qu'à l'agent affecté, et le
   **contrôle 23** mesure ce droit en excluant explicitement `status`. Sans
   elle, un rapport écrit à la première heure d'une vacation de dix heures
   disparaissait au premier verrouillage du téléphone.
3. **Pas de confirmation avant le départ.** `Alert.alert` n'est pas fiable sous
   `react-native-web`, et une confirmation qui ne s'affiche pas transforme le
   bouton en bouton mort. Le libellé dit ce qu'il fait : « Pointer mon départ et
   envoyer le rapport ».

**Le rendu mobile de la maquette a été confronté à l'écran, bloc par bloc.**
Sept blocs de `secuguard_ex_cution_mission_agent.html` sur douze n'ont aucune
source de données — NFC, rondes, PTI, batterie, MCE, caméra, code de portail.
Ils restent retirés. **Trois blocs réels leur ont été ajoutés :**

| Ajout | Ce qui remplace quoi |
|---|---|
| `/ 10h00` dans la pastille du chrono | le « / 10h00 » de la maquette, calculé sur `end_time - start_time` |
| **Journal de vacation** | le « Journal d'Événements (MCE) », réduit aux 3 horodatages qui existent |
| **Consignes du client** | les cartes « Description » et « Consignes du site », réunies et remontées |

**Le retard est annoncé par le texte ET par la couleur**, jamais par la couleur
seule : « · dépassée » en ambre pâle, lisible sur le navy et par un lecteur
d'écran. Un signal inaccessible est un signal absent.

**`updated_at` n'est pas utilisé dans le journal**, volontairement : il bouge à
chaque écriture, y compris à chaque pointage, et un journal bâti dessus
mentirait sur l'heure de ses propres lignes.

**L'écart avec la maquette est écrit à l'écran**, sous le journal comme sous les
consignes : « le modèle ne conserve aucun événement horodaté », « le modèle ne
leur réserve aucune colonne ». Un bloc manquant sans explication se lit comme un
bug ; avec elle, il se lit comme une limite.

**Refusé, et dit ici pour que ce soit tranché :** `expo-battery` pour le
« 94 % », et une table `mission_events` pour un vrai journal horodaté. Le
premier rendrait « inconnue » sur le web — donc la preuve n'existerait que sur
mobile. Le second est un choix de modèle, pas un écran, et il appartient à
l'étape 11.

**Un défaut corrigé au passage `[V]` :** le brouillon du rapport était réinitialisé
par un `useEffect` dépendant de `report`. Chaque invalidation du cache effaçait
donc la saisie en cours. La réinitialisation ne porte plus que sur un
**changement d'affectation**, et se fait pendant le rendu.

**Retiré de la maquette, faute de source `[V]` :** « Matricule AG-7842 » (aucune
colonne), « Batterie GPS 94 % » (`expo-battery` absent), « Dispositif PTI
ARMÉ », « Scan NFC Validé » (`expo-nfc` absent), les rondes et leurs points de
passage (aucune table), le « Journal d'Événements (MCE) » horodaté (aucun
historique), l'aperçu caméra (`expo-camera` absent), le code de portail et le
téléphone du responsable (aucune colonne), et la partie SOS, à la demande du
commanditaire. **Aucun n'est simulé.**

**Supposé `[X]`, non vérifié :**

- **Aucun rendu à l'écran.** `tsc`, `eslint` et `expo export` sont des preuves
  de construction, pas de fonctionnement. Un `getAgentMissions()` jamais
  exécuté peut renvoyer une forme inattendue.
- `pointer_arrivee`, `pointer_depart`, `accept_assignment` et
  `reject_assignment` **restent non exécutés**. L'écran ne fait qu'ajouter des
  boutons à des fonctions dont le comportement n'a jamais été observé.
- **La nouvelle écriture sur `report` n'a pas été exécutée non plus.** Le
  contrôle 23 mesure le droit, jamais l'écriture.

---

### Étape 12 — amorcée

- **[V]** `scripts/test-parcours.js` : joue le parcours complet avec **deux
  comptes réels**, 13 étapes, dont **5 cas négatifs**
- **[X]** **Jamais exécuté** — il exige deux couples email / mot de passe, dans
  un `.env.test` ignoré par git. C'est le premier test automatique du projet,
  et son premier résultat est encore inconnu
- **[V]** Bloqué le 2026-09-29 : dans `.env.test`, seul `TEST_AGENT_EMAIL` est
  renseigné. Les deux mots de passe et l'email client sont vides
- **[V]** Ne couvre pas l'écriture directe sur `report` avant le départ
- **[X]** Aucun test unitaire, aucun test d'intégration

**Pourquoi ce fichier existe :** les dix défauts ont tous survécu à des
contrôles qui mesurent l'état de la base. Ce test mesure ce que la base **fait**.
C'est la seule famille de contrôle qui aurait pu les voir.

---

## Fonctionnalités restantes

### Étape 6 — codée, un test la sépare de « terminée »

- **[V]** Sélection : carte actionnable, écran de réservation
- **[V]** Réservation : publication et `createAssignment`
- **[V]** Suivi : voir la mission et son prestataire
- **[V]** Clôture : `cloturer_mission`, mission et affectations ensemble
- **[X]** **Test fonctionnel de bout en bout** — seul obstacle restant

### Étape 7 — codée en entier, **rien n'est vérifié à l'écran**

- **[V]** Documents justificatifs — table `documents` existante, aucun écran
- **[V]** Disponibilités — `is_available` existe dans le schéma
- **[V]** Réception et liste des missions
- **[V]** Acceptation et refus
- **[V]** Check-in / check-out et rapport
- **[V]** Écran d'exécution `(agent)/mission/[id]`, **atteignable** depuis
  l'accueil et la liste, et **pré-rendu par `expo export`**
- **[X]** **Aucun de ces écrans n'a été ouvert.** C'est le même vide que
  l'étape 6, mais ici il porte sur tout le parcours agent.

### Étapes 8 à 13

| Étape | Contenu | Blocage |
|---|---|---|
| 8 — Société | profil, équipe, agents, missions, affectations | modèle d'agent salarié non modélisé |
| 9 — Admin | validation des comptes, documents, utilisateurs, missions, litiges | aucun écran |
| 10 — Paiement | Stripe, commission, transactions, webhooks, wallet | **prestataire et taux non confirmés** |
| 11 — Temps réel | localisation, suivi, chat, notifications | **cartographie non choisie** |
| 12 — Qualité | tests, sécurité, performances, audit | **`test:parcours` écrit, jamais exécuté** |
| 13 — Production | builds, environnement de production, monitoring | — |

---

## Problèmes rencontrés

**Dix défauts ont survécu à une chaîne de contrôles entièrement verte.** Aucun
n'était détectable de l'extérieur. Ils sont listés par gravité, avec la cause
**ÉTABLIE** ou **NON ÉTABLIE** — et une cause non établie n'est jamais inventée.

### Les dix défauts invisibles

| # | Défaut | Pourquoi aucun contrôle ne le voyait | Cause |
|---|---|---|---|
| 1 | `mission_assignments` sans politique `insert` | le contrôle 12 le voyait ; le **bilan global** annonçait « conforme » | **[V] ÉTABLIE** |
| 2 | `DEFAULT auth.uid()` de `01400` | le contrôle 18 mesurait sa **présence**, jamais son **moment d'évaluation** | **[V] ÉTABLIE** |
| 3 | `grant select` absent sur `agent_profiles` | le contrôle ne demandait que les `INSERT` | **[V] ÉTABLIE** |
| 4 | `profiles!inner(full_name, city, postal_code)` | **aucun contrôle n'existait** ; et `profiles` n'a ni `city` ni `postal_code` | **[V] ÉTABLIE** |
| 5 | politique de lecture des agents fermée aux clients | **aucun contrôle n'existait** ; invisible aussi à `check:supabase`, qui ne teste que `anon` | **[V] ÉTABLIE** |
| 6 | **`company_profiles` fermée aux clients** | le contrôle 21 ne regarde que `agent_profiles` — la table que `01900` venait de corriger | **[V] ÉTABLIE** |
| 7 | matrice sans ligne `accepted` | la fonction **existait** et ses droits étaient accordés : rien ne signalait une transition manquante | **[V] ÉTABLIE** |
| 8 | pointages déclarés `STABLE` | le contrôle mesurait l'**existence** et les droits — jamais la **volatilité** | **[V] ÉTABLIE** |
| 9 | mission et affectation closes par deux acteurs différents | chaque statut était juste, et aucun contrôle ne les comparait | **[V] ÉTABLIE** |
| 10 | `pointer_depart` à deux paramètres | le **diagnostic** envoyait un seul argument : il s'accusait lui-même, et le contrôle 25 ne teste que `proname` | **[V] ÉTABLIE** |

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
| 2026-09-28 | **DÉFAUT 10 trouvé — dans le DIAGNOSTIC, pas dans l'application** : `pointer_depart` a deux paramètres (`target_assignment_id` **et** `p_rapport`) ; le script de contrôle n'en envoyait qu'un. PostgREST résout par signature, donc `PGRST202 fonction introuvable` — et le script concluait « pas installée », sur une fonction parfaitement installée et correctement câblée. Le contrôle 25 ne le voyait pas non plus : il ne teste que `proname`. **Le corps d'appel n'est pas un détail, c'est un premier argument** |
| 2026-09-28 | **DÉFAUT 9 trouvé** : le client clôturait la mission, l'affectation restait `accepted` — « Terminée » d'un côté, « Acceptée » de l'autre, dans le même écran. Cause : `transition_mission` n'écoute que le client, `transition_assignment` que l'agent affecté, et **aucun geste unique ne faisait avancer les deux**. `complete_assignment` n'a jamais été appelée, comme `complete_mission` avant elle. Migration `20260928002400` : `cloturer_mission` fait les deux transitions ensemble, et **refuse tant qu'un prestataire n'a pas pointé son départ**. Contrôle **26** ajouté |
| 2026-09-28 | **DÉFAUT 8 trouvé** : les fonctions de pointage déclarées `STABLE` — donc annoncées comme sans effet de bord. Le `SELECT ... FOR UPDATE` de la fonction interne échouait par « read-only transaction », remonté en HTTP 405, un statut qui évoque le réseau. Migration `20260928002300`. **Contrôle 25 durci : il vérifie désormais la VOLATILITÉ, plus seulement l'existence** |
| 2026-09-28 | **DÉFAUT 7 trouvé** : la matrice de `transition_mission` ne comportait **aucune ligne pour `accepted`**. Une mission acceptée était un cul-de-sac : ni annulation, ni litige, ni clôture. `complete_mission` existait, avait ses droits, et n'a jamais été appelée — une fonction inutilisée est parfaitement conforme. Migration `20260928002200` : matrice réparée, `pointer_arrivee` et `pointer_depart` ajoutées. Contrôle **25** ajouté |
| 2026-09-28 | **Décision métier : le client clôture la mission, pas l'agent.** L'arrivée de l'agent fait passer la mission `accepted` → `in_progress` dans la MÊME opération ; l'agent termine SA vacation ; le client confirme. Un agent qui pourrait clore pourrait le faire avant l'heure, et le temps facturé s'arrêterait |
| 2026-09-28 | `mission/new` déclaré dans le `_layout` client avec `href: null` : il apparaissait comme un onglet fantôme depuis l'origine |
| 2026-09-28 | **Check-in / check-out et rapport** codés. `.select()` retiré de `checkIn` et `checkOut` — troisième occurrence du motif de P1, attrapé avant câblage. Contrôle **23** ajouté : les droits d'UPDATE des 7 colonnes de pointage n'étaient mesurés par rien, alors que le contrôle 20 mesurait ceux de l'INSERT |
| 2026-09-28 | **Migration `20260928002100` APPLIQUÉE.** Contrôle 22 au vert : sociétés lisibles, `FORCE` actif sur les 2 tables, fonction publique présente. Contrôle 4 toujours à 37 — la politique a **remplacé** l'ancienne. **22 contrôles sur 22** |
| 2026-09-29 | **DÉFAUT 11 trouvé EN VÉRIFIANT** : `dist-web/` est gitignoré mais n'était pas dans les `ignores` d'`eslint.config.js`. Le premier `expo export` suffisait donc à faire échouer `npx eslint .` avec **5 356 erreurs** sur le bundle minifié (`__r is not defined`), code source sain. Signal vert/rouge devenu illisible, et piège pour la vérification suivante. Corrigé, puis `npx eslint .` = **exit 0 avec `dist-web/` présent** |
| 2026-09-29 | **ÉCRAN D'EXÉCUTION DE MISSION RECONSTRUIT.** `src/app/(agent)/mission/[id].tsx` était resté à moitié écrit — JSX non fermé, `tsc` et `eslint` en échec. Terminé : poste actif navy avec chrono **figé** au départ, statut de la mission, consignes du site, rapport éditable, pointages d'arrivée et de départ dans l'ordre où la base les autorise. `description` et `special_requirements` ajoutés à la sélection de `getAgentMissions` — **aucune migration n'était nécessaire**, `can_view_mission` ouvre déjà la ligne à l'agent affecté. `enregistrerRapport` : première écriture directe d'un écran, limitée à `report`, dont le **contrôle 23 mesure déjà le droit**. Route déclarée `href: null` (pas d'onglet fantôme) et atteignable depuis l'accueil et la liste. `tsc` vide, `eslint .` vide, `check:supabase` conforme, `expo export` produit `/(agent)/mission/[id]` (25 Ko). **Aucun rendu à l'écran** |
| 2026-09-29 | **Lot 1 — « SecuGuard Enterprise » livré.** Audit des 11 maquettes, puis réécriture du design system : marque **noir `#000000`** au lieu du teal `#00677F`, fond `#FCF8FA`, navy `#131B2E`, ambre `#F59E0B` / `#FCDEB5`. **La paire de polices est inversée** : Hanken Grotesk passe en titres (600/700), Plus Jakarta Sans en texte courant (400/500), Manrope désinstallé. Splash : fond bleu `#208AEF` → navy `#131B2E` et **image de logo retirée** — le logo reste à produire. `name`/`slug`/`scheme` passés à `secuguard`, `userInterfaceStyle` forcé à `light`, fond de l'icône adaptative passé au navy. Tokens, 6 primitives, `AppHeader`, `tabBarOptions` et écran d'accueil client réécrits. **Aucun des 11 écrans maquettés n'est reconstruit** |
| 2026-09-29 | **Écran d'exécution : trois blocs ajoutés** — durée prévue dans la pastille du chrono (`end_time - start_time`, « · dépassée » écrit en toutes lettres, retard mesuré depuis l'arrivée réelle), « Journal de vacation » (`created_at`, `check_in_time`, `check_out_time` ; `updated_at` écarté car il bouge à chaque écriture), « Consignes du client » remontées en tête. Sept blocs de la maquette restent sans source et **ne sont pas simulés** : NFC, rondes, PTI, batterie, MCE, caméra, code portail en colonne. `expo-battery` et `mission_events` refusés, la seconde relevant de l'étape 11. `tsc`, `eslint .`, `check:supabase`, `expo export` verts. **Aucun rendu à l'écran** |
| 2026-09-29 | **`test:parcours` : tentative de lancement, bloquée.** `.env.test` existe et est ignoré par git, mais seul `TEST_AGENT_EMAIL` est renseigné ; les deux mots de passe et l'email client sont vides. Commande **non exécutée**, aucun identifiant inventé. Le test ne couvre de toute façon pas `enregistrerRapport`. Rapport mis à jour : statut « amorcée, bloquée », état de `.env.test`, périmètre du test. **Aucune vérification nouvelle** |
| 2026-09-29 | **Audit de reprise, à partir du cadrage « développeur senior » — aucun code écrit.** Mesuré : Node 24.15.0, Expo 57.0.27, `tsc` exit 0, `npx eslint .` exit 0, `check:supabase` conforme, `.env` avec les 2 variables Supabase renseignées. **Risque relevé : 105 entrées non commitées (56 fichiers modifiés ou supprimés, 49 non suivis), +4 344 / −1 181 lignes.** Le dernier commit date du 2026-09-28 : tout le design system, l'accueil agent, l'écran d'exécution de mission et les services société / documents / administration n'existent que dans le répertoire de travail. Aucune sauvegarde git. **Écart avec l'architecture cible :** `features/chat`, `payments`, `notifications`, `reviews` sont des dossiers vides ; `expo-notifications`, Stripe, cartographie et `expo-location` ne sont pas installés (cohérent avec les étapes 10 et 11 non commencées) |



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
Editor : **26 lignes, 0 `ALERTE`** (le compte a évolué de 21 à 26 le 2026-09-28).

> Un vert sur `check:supabase` ne vaut pas validation fonctionnelle. Le script
> teste le rôle `anon` et ne dit **rien** de ce qu'un utilisateur connecté voit.
> Seul un test à l'écran, avec un vrai compte, prouve qu'un parcours marche.

> `npx expo export` **puis** `npx eslint .` : cet ordre est désormais sans
> risque, `dist-web/**` étant ignoré. Avant le correctif du 2026-09-29, le
> second échouait dès que le premier avait réussi.
