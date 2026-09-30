# RAPPORT PROJET â€” SECU GUARD

> **Document de rÃ©fÃ©rence unique.** RÃ©Ã©crit intÃ©gralement le **2026-09-28**.
>
> La version prÃ©cÃ©dente datait des 26 et 27 septembre. Elle s'Ã©tait accumulÃ©e en
> trois strates contradictoires et ne pouvait plus servir de mÃ©moire : elle
> disait vrai et faux dans la mÃªme page. Le rapport de l'audit du 26 septembre
> est conservÃ©, intact, dans `docs_RAPPORT_HISTORIQUE_2026-09-26.md` (539
> lignes). **Ce document fait foi** pour l'Ã©tat courant.
>
> ### Convention de lecture
>
> Chaque affirmation porte l'une de ces mentions :
>
> - **[V]** vÃ©rifiÃ© par exÃ©cution ou lecture directe du code ;
> - **[D]** dÃ©duit, non exÃ©cutÃ© ;
> - **[X]** non vÃ©rifiÃ©, Ã  confirmer.
>
> ### Ce qui a changÃ© le 2026-09-28
>
> Session en deux temps. Le matin : remise en route de la vÃ©rification. L'aprÃ¨s-midi :
> dix dÃ©fauts, dont quatre migrations.
>
> 1. `VERIFICATION_RAPIDE.sql` Ã©tait **cassÃ© depuis le 27/09 Ã  23h52** et ne
>    pouvait plus rien vÃ©rifier. CorrigÃ©, puis Ã©tendu â€” d'abord 21, puis **26
>    contrÃ´les**, tous au vert.
> 2. **Dix dÃ©fauts** trouvÃ©s et corrigÃ©s. Trois vus par le commanditaire Ã  l'Ã©cran,
>    un trouvÃ© par le script de diagnostic **lui-mÃªme**.
> 3. Le plan des 14 Ã©tapes a Ã©tÃ© fourni. Il n'existait nulle part dans le dÃ©pÃ´t :
>    les Â« Ã©tapes 7 Ã  13 Â» citÃ©es jusqu'ici n'Ã©taient invÃ©rifiables par personne.
>
> **Aucun des dix dÃ©fauts n'Ã©tait dÃ©tectable par un contrÃ´le d'Ã©tat.** Ils
> Ã©taient dans ce que la base **fait**, pas dans ce qu'elle **contient**.

---

## Ã‰tat actuel

**Le code des parcours client et agent est complet. Le parcours agent n'a pas
Ã©tÃ© ouvert une seule fois.**

| Domaine | Ã‰tat | Preuve |
|---|---|---|
| Socle technique | âœ… OpÃ©rationnel | **[V]** `tsc --noEmit` vide Â· `npx eslint .` exit 0 |
| **Design system** | âš ï¸ **Socle refait, 2 Ã©crans sur 11** | **[V]** identitÃ© Â« SecuGuard Enterprise Â» appliquÃ©e aux tokens, aux 6 primitives, Ã  l'en-tÃªte et Ã  la navigation Â· **[V]** accueil agent et exÃ©cution de mission reconstruits Â· **[X]** aucun des deux revu Ã  l'Ã©cran |
| Base Supabase | âœ… **Saine** | **[V]** **26 contrÃ´les sur 26 au vert** Â· `check:supabase` conforme |
| SÃ©curitÃ© de la base | âœ… Sonde retirÃ©e | **[V]** contrÃ´le 17 = `0` |
| Authentification | âœ… **ValidÃ©e** | **[V]** `getUser()` serveur, profil et rÃ´les chargÃ©s |
| **Parcours client** | âš ï¸ **CodÃ©** | **[V]** demande, recherche, publication, rÃ©servation, suivi, clÃ´ture Â· **[X] clÃ´ture jamais testÃ©e |
| **Fiche agent** | âœ… **Fonctionnelle** | **[V]** crÃ©ation et modification depuis l'Ã©cran, valeurs en base |
| **Parcours agent** | âš ï¸ **CodÃ©** | **[V]** exÃ©cution de mission Ã©crite et routÃ©e Â· **[X] aucun Ã©cran ouvert Ã  ce jour |
| Espaces sociÃ©tÃ© / admin | âœ… **8 Ã©crans branchÃ©s** | **[V]** les 4 Ã©crans vides branchÃ©s aux services le 2026-09-30 Â· **[X] aucun rouvert Ã  l'Ã©cran |
| **Faux compteurs** | âœ… **CorrigÃ©s** | **[V]** l'accueil admin affichait `value="0"` en dur Â· **[V]** aucun Ã©cran ne lit `profile.role` |
| **Routage** | âœ… **DÃ©sambiguÃ¯sÃ© et contrÃ´lÃ©** | **[V]** 23 URL publiques, **0 doublon** Â· **[V]** `npm run check:routes` conforme, auto-test 8 cas |
| **Ã‰cran 404** | âœ… **CrÃ©Ã©** | **[V]** `+not-found.tsx` Â· **[V]** `dist/+not-found.html` gÃ©nÃ©rÃ© Â· **[X]** non rouvert Ã  l'Ã©cran |
| **Ã‰tape 12 â€” qualitÃ©** | âš ï¸ **amorcÃ©e, bloquÃ©e** | **[V]** `test:parcours` Ã©crit Â· **[V]** `.env.test` incomplet (3 valeurs sur 4 vides, constatÃ© le 2026-09-29) Â· **[X]** jamais exÃ©cutÃ© |

---

## DÃ©faut 11 â€” quatre fichiers pour une seule URL (2026-09-30)

**ConstatÃ© par le commanditaire**, en ouvrant `http://localhost:8081/profile`
et en obtenant un Ã©cran absent.

### Ce que c'Ã©tait

En Expo Router, **un groupe entre parenthÃ¨ses n'entre pas dans l'URL**. Quatre
frais de nom suffisaient donc Ã  produire la mÃªme adresse publique :

| Fichier (avant) | URL publique | Espace |
|---|---|---|
| `(client)/profile.tsx` | `/profile` | client |
| `(agent)/profile.tsx` | `/profile` | agent |
| `(company)/profile.tsx` | `/profile` | sociÃ©tÃ© |
| `(admin)/profile.tsx` | `/profile` | admin |

Le mÃªme dÃ©faut existait sur `/missions` (4 fichiers) et `/mission/[id]` (2
fichiers). **La table de routes gÃ©nÃ©rÃ©e dÃ©clarait `/profile` quatre fois** â€”
c'est elle qui a permis de le voir, et non la lecture des Ã©crans.

Ã€ l'ouverture de `/profile`, le routeur Ã©lisait un vainqueur arbitraire. Si le
rÃ´le de l'utilisateur ne correspondait pas, `ProtectedRoute`
(`src/components/auth/ProtectedRoute.tsx:93`) le redirigeait vers
`/(auth)/role-selection` : d'oÃ¹ l'Ã©cran Â« absent Â».

**Ce que cela ne cassait pas :** la navigation interne. Les 12 `router.push`
portaient tous le groupe (`/(client)/profile`), et les onglets fonctionnaient.
**Seule la saisie manuelle d'URL, et donc le partage de lien, Ã©tait en cause.**

### Aucune des trois vÃ©rifications obligatoires ne l'aurait vu

`tsc --noEmit` passe, et il passerait encore : `typedRoutes` valide la **forme**
d'une chaÃ®ne, pas son **unicitÃ©**. `/(client)/profile` est une chaÃ®ne
parfaitement valide. C'est le onziÃ¨me dÃ©faut de la mÃªme famille que les dix du
28 septembre â€” dans ce que la base **fait**, pas dans ce qu'elle **contient**.

### Correction â€” option A, suffixes d'espace **[V]**

Les noms de fichiers portent dÃ©sormais l'espace, donc l'URL aussi. Les groupes
sont conservÃ©s : ils portent les gardes `ProtectedRoute` et les `Tabs`.

| Avant (URL) | AprÃ¨s (URL) |
|---|---|
| `/profile` (Ã—4) | `/profil-client` Â· `/profil-agent` Â· `/profil-societe` Â· `/profil-admin` |
| `/missions` (Ã—4) | `/missions-client` Â· `/missions-agent` Â· `/missions-societe` Â· `/missions-admin` |
| `/mission/[id]` (Ã—2) | `/mission-suivi/[id]` Â· `/mission-execution/[id]` |

**24 occurrences** de routes mises Ã  jour dans 9 fichiers, plus **10**
`Tabs.Screen` dans les 4 layouts. Les renommages ont Ã©tÃ© faits par `git mv` :
git les enregistre comme renommages, pas comme suppressions.

### Preuves **[V]**

- `tsc --noEmit` vide Â· `npx eslint .` exit 0 Â· `check:supabase` conforme.
- **ZÃ©ro rÃ©fÃ©rence rÃ©siduelle** aux anciennes routes, recherche sur `src/`.
- **Table de routes rÃ©gÃ©nÃ©rÃ©e** : 22 URL publiques, **0 doublon**. `/profile`,
  `/missions` et `/mission/[id]` ont **disparu** de la table.

### Le cache Metro a menti une fois de plus **[V]**

Le premier relevÃ© de la table de routes, aprÃ¨s les renommages, affichait
**encore** `/profile` et `/missions` **et** les nouveaux noms. Fichier datÃ© de
03:43:50, soit avant les renommages : c'Ã©tait un cache pÃ©rimÃ©, pas la vÃ©ritÃ©.
Le fichier ne se rÃ©gÃ©nÃ¨re qu'au dÃ©marrage du serveur de dev â€” le supprimer ne
suffit pas, il faut relancer `expo start`. AprÃ¨s redÃ©marrage, le fichier est
passÃ© de 16 009 Ã  12 069 octets et ne contient plus que les nouveaux noms.

> C'est le mÃªme piÃ¨ge que celui du manifeste PWA, documentÃ© plus bas : un vert
> sur `typecheck` + `eslint` n'aurait jamais vu ce dÃ©faut, et un cache
> pÃ©rimÃ© aurait pu faire croire qu'il n'Ã©tait pas corrigÃ©.

### Ce qui reste Ã  faire **[X]**

**Aucun Ã©cran renommÃ© n'a Ã©tÃ© rouvert Ã  l'Ã©cran.** `typecheck`, `eslint` et la
table de routes prouvent que les routes sont uniques et cohÃ©rentes â€” pas qu'un
onglet affiche le bon contenu. C'est la limite que ce projet s'est donnÃ©e dÃ¨s le
premier dÃ©faut.

---

## IdentitÃ© visuelle â€” Â« SecuGuard Enterprise Â» (2026-09-29)

Le design livrÃ© dans `design/` remplace l'identitÃ© prÃ©cÃ©dente. **Lot 1
terminÃ© : le socle est refait, les 11 Ã©crans maquettÃ©s ne le sont pas encore.**

### Combien d'Ã©crans, en fait **[V]**

ComptÃ© sur le code, pas estimÃ©.

| | Nombre | DÃ©tail |
|---|---|---|
| **Ã‰crans rÃ©els** | **27** | fichiers de route dans `src/app`, hors `_layout` et `+not-found` |
| **Maquettes d'Ã©crans** | **11** | 10 dans `stitch/` + `paramettre` Ã  la racine |
| **Routes couvertes par une maquette** | **7** | voir tableau ci-dessous |
| **Routes sans maquette** | **19** | diffÃ©rÃ©es |
| **Maquettes sans route** | **2** | 2FA et Ã©valuation, Ã  crÃ©er en visuel pur |
| **Ã‰crans reconstruits** | **2** | accueil agent, exÃ©cution de mission Â· 9 restent |

| Maquette | Route rÃ©elle | Lot |
|---|---|---|
| `splash_screen` | *aucune* â€” `app.json` + `StartupGate` | 2A |
| `bienvenue_onboarding` | `(startup)/onboarding` | 2A |
| `onboarding_pr_sentation` | `(startup)/onboarding` â€” mÃªme route, 2e et 3e slides | 2A |
| `authentification_2fa` | *aucune* â€” **Ã  crÃ©er** | 3 |
| `connexion` | `(auth)/sign-in` | 2B |
| `cr_ation_de_compte` | `(auth)/sign-up` | 2B |
| `r_server_et_payer` | `(client)/mission/new` | 2C |
| `ex_cution_mission_agent` | `(agent)/mission/[id]` | **2C â€” reconstruit** |
| `revenus_historique_agent` | `(agent)/index` | 2C |
| `valuer_le_service` | *aucune* â€” **Ã  crÃ©er** | 3 |
| `paramettre` | `(client)/profile` | 2D |

**Trois piÃ¨ges dans ce dÃ©compte**, qui expliquent les Â« 10 Â» antÃ©rieurs :

1. `stitch/secuguard_authentification_2fa/` **n'existait pas** comme HTML
   racine : Ã  la racine il n'y a que `authentification_2fa.png`, **sans HTML**.
   Le PNG seul a fait perdre une maquette Ã  chaque inventaire prÃ©cÃ©dent.
2. `stitch/secuguard_enterprise/` **ne contient qu'un `DESIGN.md`** â€” ni HTML ni
   PNG. Ce n'est pas un Ã©cran, c'est la documentation du design system. En le
   comptant, `stitch` annonÃ§ait 11 dossiers pour 10 Ã©crans : c'est de lÃ  que
   venait le compte Â« 10 Â», et il Ã©tait juste **par accident**.
3. `design/code.html` est la **galerie de composants** de Stitch, pas un Ã©cran.

`paramettre` n'existe que Ã  la racine, pas dans `stitch`. Enfin,
`(client)/index` a Ã©tÃ© restylÃ© au lot 1 **sans avoir de maquette** : c'est de
la mise en conformitÃ© au socle, pas une reconstruction.

### RÃ¨gle de lecture du design

`design/DESIGN.md` se contredit sur deux points : son bloc YAML dÃ©clare
`primary: #000000`, le texte juste en dessous annonce Â« Primary #0F172A Â»,
et ni l'un ni l'autre n'apparaÃ®t dans les rendus. **Quand `DESIGN.md` et les
maquettes divergent, la maquette l'emporte** : le PNG et le HTML sont
cohÃ©rents entre eux, le texte ne l'est pas.

### Ce qui est vÃ©rifiÃ© **[V]**

RelevÃ© sur le `tailwind.config` embarquÃ© dans chaque maquette, puis posÃ© dans
`src/constants/index.ts`.

| Token | IdentitÃ© prÃ©cÃ©dente | IdentitÃ© Â« SecuGuard Â» |
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

**La paire de polices est inversÃ©e.** Hanken Grotesk porte dÃ©sormais tout ce
qui est titre, libellÃ© ou bouton ; Plus Jakarta Sans le texte courant. Manrope
a Ã©tÃ© dÃ©sinstallÃ©.

**Sur le splash, j'ai retirÃ© l'image.** `expo-splash-screen` configurait un
`image` de 76 px sur fond `#208AEF`. Le fond est passÃ© au navy `#131B2E` et le
logo a Ã©tÃ© retirÃ© : l'application affiche dÃ©sormais un aplat navy nu. Le logo
de la maquette reste **Ã  produire** â€” `assets/images/splash-icon.png` est
dÃ©sormais inutilisÃ©, et l'absence d'image n'est pas un choix esthÃ©tique
dÃ©fendable, c'est un manque.

### Le point qui n'est pas une question de goÃ»t

**La couleur de marque est passÃ©e du teal `#00677F` au noir `#000000`.** Dans
la maquette, les boutons d'action sont noirs et le teal n'apparaÃ®t nulle part.
Le bleu ne survit que comme teinte de fond froide (`primaryLight` `#DAE2FD`,
`secondaryContainer` `#D5E3FD`). ConsÃ©quence : l'onglet inactif est redevenu
gris, et non plus Â« bleu attÃ©nuÃ© Â». C'est une rÃ©gression visuelle **voulue**,
pas un oubli.

### Deux points vÃ©rifiÃ©s **[V]**

**Le manifeste PWA gardait l'ancienne identitÃ© â€” dÃ©faut trouvÃ© en construisant.**

`npx expo export` avait rÃ©ussi du premier coup, `tsc` et `eslint` Ã©taient
verts, et le bundle contenait malgrÃ© tout :

```
"name":"secu", "shortName":"secu", "backgroundColor":"#208AEF"
```

L'`app.json` ne dÃ©clarait **aucun** `expo.web.name`, `shortName`,
`backgroundColor` ni `themeColor` : le manifeste hÃ©ritait de valeurs
prÃ©cÃ©dentes. Le nom affichÃ© dans l'onglet du navigateur, le nom de
l'application installÃ©e et la couleur de fond du splash navigateur Ã©taient
restÃ©s ceux de Â« secu Â». CorrigÃ© dans `app.json`, puis vÃ©rifiÃ© dans le bundle
reconstruit : `#208AEF` est passÃ© de 1 occurrence Ã  **0**.

**Un cache Metro resservait la configuration pÃ©rimÃ©e.** AprÃ¨s la correction,
l'export produisait *encore* l'ancien `app.json` â€” fichier au hash identique
Ã  l'export prÃ©cÃ©dent, malgrÃ© la suppression de `dist-web/` et de `.expo/`.
`npx expo config --clear` **n'existe pas** en Expo 57 (option refusÃ©e par
`node`). La purge se fait avec `npx expo export --clear`, qui vide le cache
Metro. **Un vert sur `typecheck` + `eslint` n'aurait jamais vu ce dÃ©faut.**

**Le `scheme` ne casse rien.** Recherche rÃ©cursive dans `src/` : aucun
`signInWithOAuth`, `signInWithOtp`, `getOAuthSignInUrl`, `redirectTo` ni
`Linking.openURL`. L'application n'a aucune redirection OAuth, il n'y avait
donc rien Ã  mettre en cohÃ©rence avec `secuguard://`. **Si Google ou Apple est
ajoutÃ© un jour**, c'est Ã  ce moment-lÃ  qu'il faudra inscrire `secuguard://`
dans les Redirect URLs du tableau de bord Supabase â€” pas avant.

**Un dÃ©faut prÃ©existant, non corrigÃ©.** `_layout.tsx:40` masque le splash dÃ¨s
que les polices sont chargÃ©es, et `StartupGate.tsx:48` le masque de nouveau
aprÃ¨s la session. Le premier `hideAsync` l'emporte : le splash disparaÃ®t
avant que la session soit connue, alors que le rapport historique annonÃ§ait
l'inverse. **Ce n'est pas une rÃ©gression de ce lot** â€” le diff de
`_layout.tsx` ne touche pas ce `useEffect` â€” mais c'est un Ã©cart entre ce
qui est Ã©crit et ce qui est fait.

### Les assets Ã©taient ceux du template Expo **[V]**

Aucun `typecheck`, aucun `eslint` et aucun export ne pouvait le voir : ce sont
des fichiers, et ils n'Ã©taient pas faux, ils Ã©taient **Ã  cÃ´tÃ©**.

- `icon.png` pesait 799 Ko et reprÃ©sentait l'icÃ´ne par dÃ©faut d'Expo â€” un Â« A Â»
  bleu â€” et non SecuGuard. C'est aussi l'image **utilisÃ©e dans `AppHeader`**,
  sur un en-tÃªte clair : l'application affichait un bloc bleu Ã  son sommet.
- `splash-icon.png` faisait 3317 octets, exactement la taille de
  `expo-logo.png` : c'Ã©tait le logo Expo. Le retirer au lot 1 Ã©tait donc
  justifiÃ©, mais il fallait le remplacer.
- `react-logo*`, `expo-badge*`, `tutorial-web.png`, `logo-glow.png` et
  `tabIcons/` (6 fichiers) Ã©taient **orphelins** : zÃ©ro rÃ©fÃ©rence dans `src/`
  et dans `app.json`. `tabIcons/` datait du passage Ã  `MaterialCommunityIcons`.
- `assets/expo.icon/` Ã©tait un dossier Icon Composer d'Expo, rÃ©fÃ©rencÃ© comme
  icÃ´ne iOS.

**Le logo est produit**, pas empruntÃ© : bouclier et coche en ambre pÃ¢le
`#FCDEB5` sur navy `#131B2E`, dessinÃ©s par `scripts/generer-logo.ps1` Ã  partir
des mÃªmes constantes que `src/constants`. Sept fichiers produits, dont
`secuguard-mark.png` sur fond transparent â€” c'est celui-lÃ  qu'`AppHeader`
affiche, parce qu'une icÃ´ne Ã  fond navy sur un en-tÃªte clair donne un bloc
sombre. Le monochrome est blanc, pour l'icÃ´ne adaptative Android.

L'en-tÃªte affichait aussi le nom **`Secu`**. Il affiche maintenant `SecuGuard`,
et `package.json` ne s'appelle plus `secu` non plus. `dist-web/` a Ã©tÃ© supprimÃ©
et ajoutÃ© au `.gitignore` : il n'y Ã©tait pas, il aurait Ã©tÃ© commitÃ©.

**Limite Ã  connaÃ®tre : ni le splash ni l'icÃ´ne ne sont visibles sous Expo Go.**
`expo-splash-screen` et les icÃ´nes ne s'appliquent qu'Ã  un *development build*
ou un build de production. Expo Go affiche son propre Ã©cran de dÃ©marrage. Ce
qui **est** vÃ©rifiable sous Expo Go : palette, polices, composants, navigation.

### Ce qui reste Ã  faire **[X]**

**2 des 11 Ã©crans maquettÃ©s sont reconstruits** : l'accueil agent et
l'exÃ©cution d'une mission. Les 9 autres ne le sont pas.

Aucun des deux n'a Ã©tÃ© revu Ã  l'Ã©cran : `typecheck`, `eslint` et
`expo export` ne disent rien du rendu. C'est la limite que ce projet s'est
donnÃ©e dÃ¨s le premier dÃ©faut.

---

## Ã‰tape en cours

### Ã‰TAPES 6 ET 7 â€” PARCOURS COMPLET Ã‰CRIT, **RIEN N'EST VÃ‰RIFIÃ‰ Ã€ L'Ã‰CRAN**

Session du **2026-09-28**, deuxiÃ¨me partie. La premiÃ¨re partie avait validÃ© la
demande, la recherche, la publication et la rÃ©servation.

| Domaine | Ã‰crit | VÃ©rifiÃ© Ã  l'Ã©cran |
|---|---|---|
| Ã‰tape 6 â€” parcours client | **complet** | jusqu'Ã  la rÃ©servation seulement |
| Ã‰tape 7 â€” parcours agent | **complet** | **[X] aucun Ã©cran ouvert Ã  ce jour |

**C'est le seul obstacle qui reste**, et il n'est pas dans le code.

### Ce que la session a produit

| Ã‰lÃ©ment | Preuve |
|---|---|
| Pointage d'arrivÃ©e et de dÃ©part | **cÃ´tÃ© agent**, jamais ouvert |
| Rapport joint au dÃ©part | `pointer_depart(affectation, p_rapport)` |
| Ã‰cran de disponibilitÃ© | `is_available` |
| `cloturer_mission` | migration `20260928002400` |
| `scripts/test-parcours.js` | 13 Ã©tapes, 5 cas nÃ©gatifs, **[X] jamais exÃ©cutÃ©** |

### Les dix dÃ©fauts

Trois ont Ã©tÃ© vus **par le commanditaire**, pas par un contrÃ´le : la mission
Â« TerminÃ©e Â» pendant que l'affectation disait Â« AcceptÃ©e Â», un pointage en
`HTTP 405`, et un diagnostic qui s'accusait lui-mÃªme.

**Aucun des dix n'Ã©tait dÃ©tectable par un contrÃ´le d'Ã©tat.** Voir
*ProblÃ¨mes rencontrÃ©s*.

---

## Ã‰tapes terminÃ©es

| Ã‰tape | Statut | Nature de la validation |
|---|---|---|
| 0 â€” Environnement | âœ… | **[V]** Node 24.15.0, npm 11.12.1, Expo 57.0.25, Router 57.0.23, TypeScript 6.0.3 |
| 1 â€” Architecture | âœ… | **[V]** structure conforme au plan, design system, `RAPPORT_PROJET.md` |
| 2 â€” Page d'accueil | âœ… | **[V]** `welcome.tsx`, export web, polices chargÃ©es avant le splash |
| 3 â€” Supabase | âœ… | **[V]** 26 contrÃ´les au vert Â· **Ã©criture testÃ©e Ã  l'Ã©cran** |
| 4 â€” Authentification | âœ… | **[V]** inscription, connexion, session persistante, rÃ´les |
| 5 â€” Routing par rÃ´le | âœ… | **[V]** les 4 groupes rendent, `ProtectedRoute` par rÃ´le |
| 6 â€” Parcours client | âš ï¸ **codÃ©** | **[V]** demande, recherche, publication, rÃ©servation Â· **[X] suivi et clÃ´ture non testÃ©s |
| 6 bis â€” Fiche agent | âœ… | **[V]** crÃ©ation **et** modification, valeurs en base |
| 6 ter â€” Recherche | âœ… | **[V]** agent retrouvÃ© par un compte client |
| 7 â€” Parcours agent | âš ï¸ **codÃ©** | **[X] aucun Ã©cran ouvert |
| 12 â€” QualitÃ© | âš ï¸ **amorcÃ©e, bloquÃ©e** | **[V]** `test:parcours` Ã©crit Â· **[V]** `.env.test` incomplet Â· **[X]** jamais exÃ©cutÃ© |

> Les Ã©tapes 6 et 7 sont marquÃ©es Â« codÃ© Â», pas Â« terminÃ©e Â». **Du code non
> exÃ©cutÃ© n'est pas une fonctionnalitÃ©**, et l'Ã©tape 6 l'a dÃ©jÃ  dÃ©montrÃ© : elle
> Ã©tait couverte par des contrÃ´les verts et le parcours Ã©tait cassÃ© trois fois.

---

## Prochaine Ã©tape

### Lancer `test:parcours`, puis ouvrir les Ã©crans de l'Ã©tape 7

**C'est la seule chose qui bloque.** Tout le reste est Ã©crit.

**Ã‰tat constatÃ© le 2026-09-29 [V]** â€” `.env.test` existe, est ignorÃ© par git
(`.gitignore:36`), mais n'est pas renseignÃ© :

| ClÃ© | Ã‰tat |
|---|---|
| `TEST_CLIENT_EMAIL` | vide |
| `TEST_CLIENT_PASSWORD` | vide |
| `TEST_AGENT_EMAIL` | renseignÃ©e |
| `TEST_AGENT_PASSWORD` | vide |

Le test n'a **pas** Ã©tÃ© lancÃ© : un mot de passe ne se devine pas, et aucun
n'a Ã©tÃ© inventÃ©. Le script s'arrÃªte sur `CONFIGURATION INCOMPLETE` avant sa
premiÃ¨re Ã©tape **[D]** â€” cette sortie n'a pas Ã©tÃ© observÃ©e, la commande n'ayant
pas Ã©tÃ© exÃ©cutÃ©e.

**Ã€ faire par le commanditaire :** renseigner les trois valeurs vides, avec deux
comptes **distincts** et **jetables**. Le test crÃ©e une mission par exÃ©cution et la
clÃ´ture ; une mission close ne se rouvre pas, et aucune politique de
suppression cÃ´tÃ© client n'existe. Le compte agent doit avoir une fiche
`agent_profiles` complÃ¨te, sinon le test s'arrÃªte Ã  l'Ã©tape 0.

**1. Le test automatique** â€” 3 valeurs Ã  renseigner dans `.env.test`, puis :

```bash
npm run test:parcours
```

Il joue le parcours avec deux comptes rÃ©els et **cinq cas nÃ©gatifs** â€” clore
une mission qui n'a pas commencÃ©, partir sans Ãªtre arrivÃ©, clore avant le
dÃ©part, departure rÃ©pÃ©tÃ©e, clÃ´turer deux fois. Ces cinq transitions **n'ont
jamais Ã©tÃ© essayÃ©es**.

**2. Les Ã©crans de l'Ã©tape 7** â€” le test joue la base, pas React Native.
Le parcours agent reste non vÃ©rifiÃ© mÃªme si le test est vert.

**Ce que `test:parcours` ne couvre pas [V, par lecture du script] :**
l'Ã©criture directe sur `report` (`enregistrerRapport`) avant le dÃ©part. Le script
ne fait passer le rapport que par `pointer_depart`. Le droit est mesurÃ© par le
contrÃ´le 23 (Ã©tat des `grant`), mais **l'Ã©criture elle-mÃªme n'a jamais Ã©tÃ©
exÃ©cutÃ©e**. Elle demande un test Ã  part ou l'ouverture de l'Ã©cran.

**Ce qu'il faut ouvrir, dans cet ordre, avec une session agent rÃ©elle :**

1. `(agent)/missions` â€” la liste, et `accept_assignment` / `reject_assignment`,
   **jamais exÃ©cutÃ©es** ;
2. `(agent)/mission/[id]` â€” l'Ã©cran d'exÃ©cution, **atteignable mais jamais
   rendu** : chrono, consignes, rapport, pointage d'arrivÃ©e puis de dÃ©part ;
3. `(agent)/index` â€” l'accueil reconstruit, dans ses trois Ã©tats.

Le premier Ã©cran Ã  ouvrir est le second : c'est lÃ  que se trouvent les quatre
fonctions de transition que personne n'a jamais vues rÃ©pondre.

**3. Ensuite seulement**, les dÃ©cisions mÃ©tier : missions publiÃ©es cÃ´tÃ© agent,
modÃ¨le fermÃ© ou appel d'offres, annuaire rÃ©ciproque, visibilitÃ© de l'adresse.

### Le test qui a jugÃ© l'Ã©tape â€” RÃ‰USSI

**[V]** Le 2026-09-28, avec un compte client, dans le navigateur :

1. Publier un brouillon â†’ le badge passe Ã  `PubliÃ©e`
2. Rechercher â†’ toucher une carte â†’ Ã©cran de rÃ©servation
3. Choisir la mission â†’ **RÃ©server**
4. ContrÃ´le en base : **2 lignes** crÃ©Ã©es, `status = pending`, cible `agent`,
   mission `published`

C'est la **premiÃ¨re transition d'Ã©tat jamais exÃ©cutÃ©e** dans ce projet, et elle
fonctionne. C'est aussi la premiÃ¨re fois qu'une Ã©criture de `mission_assignments`
passe rÃ©ellement par la politique et le `grant`.

### Ce qui reste ouvert, et c'est l'essentiel

- **[X] Le prestataire ne voit RIEN de cette affectation.** L'Ã©cran agent
  n'existe pas. La politique `can_view_assignment` n'a donc jamais Ã©tÃ©
  Ã©valuÃ©e du cÃ´tÃ© agent.
- **[X] `accept_assignment` et `reject_assignment` ne sont toujours jamais
  exÃ©cutÃ©es.** L'affectation restera `pending` indÃ©finiment.
- **[X] `getAgentMissions()`** interroge `missions` par imbrication. C'est le
  motif qui a dÃ©jÃ  cassÃ© deux fois, et il n'a jamais Ã©tÃ© exÃ©cutÃ©.

### Ce qui suit, et qui n'est pas fait

- **[D]** `missions.city` sans clÃ© Ã©trangÃ¨re : dÃ©cision par dÃ©faut, **migration
  non Ã©crite**, en attente de validation sÃ©parÃ©e.
- **[V]** `mission/new` n'est pas dÃ©clarÃ© dans le `_layout` du groupe client :
  il apparaÃ®t probablement comme un onglet. SignalÃ©, non corrigÃ© hors pÃ©rimÃ¨tre.

**SÃ©quence confirmÃ©e par l'exÃ©cution :** la publication prÃ©cÃ¨de bien la
rÃ©servation. La politique d'insertion exige `m.status = 'published'`, et une
affectation sur un brouillon serait refusÃ©e.

---

## Architecture

### Cible (issue du plan, section 5)

```text
src/
â”œâ”€â”€ app/                    Expo Router : layouts et Ã©crans uniquement
â”‚   â”œâ”€â”€ _layout.tsx
â”‚   â”œâ”€â”€ index.tsx
â”‚   â”œâ”€â”€ (auth)/  (client)/  (agent)/  (company)/  (admin)/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                 transverses, sans logique mÃ©tier
â”‚   â”œâ”€â”€ forms/
â”‚   â””â”€â”€ common/
â”œâ”€â”€ features/               logique mÃ©tier, un dossier par domaine
â”‚   â”œâ”€â”€ auth/  clients/  agents/  companies/  missions/
â”‚   â””â”€â”€ payments/  chat/  notifications/  reviews/
â”œâ”€â”€ hooks/
â”œâ”€â”€ stores/                 Zustand, uniquement si justifiÃ©
â”œâ”€â”€ services/               accÃ¨s aux donnÃ©es
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ supabase/           SEUL point d'accÃ¨s Ã  Supabase
â”‚   â”œâ”€â”€ api/
â”‚   â””â”€â”€ utils/
â”œâ”€â”€ types/                  contrats centralisÃ©s
â””â”€â”€ constants/              couleurs, espacements, tailles
```

### Ã‰tat rÃ©el et Ã©carts

**[V]** La structure suit le plan, avec quatre Ã©carts :

| Ã‰cart | Ã‰tat rÃ©el | Traitement |
|---|---|---|
| `features/auth/` | absent â€” `AuthContext` est dans `src/context/` | **[D]** Ã  dÃ©placer, sinon la rÃ¨gle Â« logique mÃ©tier dans `features` Â» n'est pas tenue. **Non fait sans accord.** |
| `features/clients/`, `agents/`, `companies/`, `payments/`, `chat/`, `notifications/`, `reviews/` | absents | **[V]** normal : ces domaines ne sont pas encore construits |
| `lib/api/` | vide | **[V]** aucun besoin : `supabase-js` suffit Ã  ce stade |
| `stores/` | vide, `zustand` installÃ© | **[V]** installÃ© sans usage, prÃ©vu pour les Ã©tapes 10-11 |

**RÃ¨gle appliquÃ©e sans exception :** `src/lib/supabase` est le seul module qui
importe le client. `src/app` ne contient que des Ã©crans, `features` porte la
logique mÃ©tier, `components` reste transverse.

---

## Structure des dossiers

**[V]** 117 fichiers `.ts` / `.tsx`, recomptÃ©s le 2026-09-30. Le chiffre
prÃ©cÃ©dent, 91, datait d'avant le lot design system.

| Dossier | Fichiers | Contenu |
|---|---|---|
| `src/app` | 35 | 27 Ã©crans + 6 layouts + `+not-found` |
| `src/components` | 32 | `ui` 13 Â· `common` 9 Â· `forms` 5 Â· `auth` 3 Â· `navigation` 2 |
| `src/features` | 23 | `missions` 7 Â· `prestataires` 5 Â· `villes` 3 Â· `administration` 2 Â· `companies` 2 Â· `documents` 2 Â· `portefeuille` 2 |
| `src/lib` | 11 | `supabase` 6 Â· `storage` 2 Â· `utils` 2 Â· `queryClient` 1 |
| `src/services` | 9 | `missions` Â· `providers` Â· `profiles` Â· `villes` Â· `companies` Â· `administration` Â· `documents` Â· `portefeuille` Â· `index` |
| `src/hooks` | 3 | `useAuth` Â· `useProfile` Â· `index` |
| `src/context` | 2 | `AuthContext` Â· `index` |
| `src/constants` | 1 | tokens centralisÃ©s |
| `src/types` | 1 | contrats dÃ©rivÃ©s du schÃ©ma |

**Les 6 groupes de routage :**

| Groupe | Ã‰crans | Ã‰tat |
|---|---|---|
| `(startup)` | `onboarding`, `profile-selection` | âœ… |
| `(auth)` | `sign-in`, `sign-up`, `role-selection` | âœ… |
| `(client)` | `index`, `missions-client`, `mission/new`, `mission-suivi/[id]`, `prestation/[id]`, `search`, `profil-client` | âœ… 7 sur 7 |
| `(agent)` | `index`, `profil-agent`, `missions-agent`, `availability`, `mission-execution/[id]` | âœ… 5 sur 5, **[X] aucun ouvert** |
| `(company)` | `index` Â· `profil-societe` Â· `missions-societe` Â· `team` â€” **tous branchÃ©s** | âœ… **4 sur 4** Â· **[X] aucun rouvert |
| `(admin)` | `index` Â· `profil-admin` Â· `missions-admin` Â· `users` â€” **tous branchÃ©s** | âœ… **4 sur 4** Â· **[X] aucun rouvert |
| racine | `index` (`StartupGate`), `welcome`, **`+not-found`** | âœ… |

> **Noms renommÃ©s le 2026-09-30.** Les quatre groupes partageaient `profile`
> et `missions`, et deux partageaient `mission/[id]` : onze URL publiques pour
> huit Ã©crans. Les fichiers portent dÃ©sormais l'espace â€” `profil-client`,
> `missions-agent`, `mission-suivi/[id]`, `mission-execution/[id]`. Voir
> *DÃ©faut 11*.

> **`+not-found.tsx` n'existait pas avant le 2026-09-30.** Aucune URL erronÃ©e
> n'affichait quoi que ce soit : un Ã©cran vide, sans explication. C'est la
> consÃ©quence directe du dÃ©faut 11 â€” corriger les routes ne corrige pas la
> classe de problÃ¨me.

### Ce que la mesure corrige dans ce rapport **[V]**

La version prÃ©cÃ©dente de ce document affirmait Â« espaces sociÃ©tÃ© / admin :
**Ã©crans vides, aucune requÃªte de donnÃ©e** Â». C'est **faux**, et la phrase
datait d'avant le commit `52d7196`, qui a construit la couche de donnÃ©es
sans que le tableau soit repris.

| Mesure | Valeur |
|---|---|
| Ã‰crans de `src/app` important `@/features`, `@/services` ou `@/hooks` | **13 sur 27** avant le branchement, **17 sur 27** aprÃ¨s |
| `(company)/index.tsx` | **4 hooks** : `useMaFicheSociete`, `useMonEquipe`, `useMesAffectationsSociete`, `usePortefeuille` |
| Services Ã©crits **non appelÃ©s par un Ã©cran** | aucun : les 4 Ã©crans vides sont branchÃ©s le 2026-09-30 |
| Ã‰crans sans aucune lecture | **aucun** â€” les 27 Ã©crans lisent la base ou la session |

La couche de donnÃ©es existait depuis le commit `52d7196`. **Le dernier
kilomÃ¨tre â€” l'appel depuis l'Ã©cran â€” n'a Ã©tÃ© fait que le 2026-09-30.** C'est la
mÃªme distinction que Â« codÃ© Â» et Â« terminÃ© Â» : du code non exÃ©cutÃ© n'est pas une
fonctionnalitÃ©.

### Les 4 Ã©crans branchÃ©s le 2026-09-30 **[V]**

| Ã‰cran | Service branchÃ© | Ce que l'Ã©cran affiche |
|---|---|---|
| `(company)/team.tsx` | `companiesService.getMyTeam` | agents rattachÃ©s, statut, zone, disponibilitÃ© |
| `(company)/missions-societe.tsx` | `missionsService.getCompanyMissions` | affectations reÃ§ues, pointages, budget |
| `(admin)/users.tsx` | `administrationService.getDossiersEnAttente` | file de validation, par statut |
| `(admin)/missions-admin.tsx` | **nouveau** `useMissionsAdmin` | toutes les missions, filtrage local par statut |

**Une seule migration a Ã©tÃ© nÃ©cessaire : aucune.** La lecture globale des
missions par un administrateur Ã©tait dÃ©jÃ  autorisÃ©e â€” `private.can_view_mission`
commence par `private.is_admin()` (`20260925000200_rls_helpers.sql:35`). Ce qui
manquait Ã©tait l'Ã©cran, pas le droit.

### Trois boutons qui ont Ã©tÃ© supprimÃ©s, et pourquoi **[V]**

Les quatre Ã©crans affichaient un texte d'Ã©tat vide et un bouton. Dans les trois
cas suivants, le bouton promettait une fonction qui n'existe pas :

| Bouton retirÃ© | Pourquoi |
|---|---|
| Â« Inviter un agent Â» | aucune fonction serveur ne rattache un agent Ã  une sociÃ©tÃ© |
| Â« Rechercher des missions Â» | aucun appel d'offres : `missions` est crÃ©Ã© par un client |
| (validation admin) | aucune des 11 RPC ne change un statut de prestataire |

> Un bouton qui ne fait rien est **pire que son absence** : il promet une action
> que l'application ne sait pas exÃ©cuter, et l'utilisateur croirait Ã  une panne.
> Les Ã©crans annoncent dÃ©sormais explicitement que la dÃ©cision se prend hors
> application.

### Ce qui n'a pas Ã©tÃ© fait, et pourquoi **[V]**

Les **Ã©crans de validation et d'annulation** n'ont pas Ã©tÃ© ajoutÃ©s. Ils
nÃ©cessiteraient de nouvelles fonctions serveur, donc une migration â€” dÃ©cision
qui vous revient, et que ce lot n'a pas prise Ã  votre place.

### Fichiers racine

`app.json` Â· `tsconfig.json` Â· `eslint.config.js` Â· `.env` / `.env.example` Â·
`AGENTS.md` Â· `README.md` Â· `RAPPORT_PROJET.md` Â· `design/` Â· `dist/` (export web)

---

## Technologies

**[V]** RelevÃ© le 2026-09-28 sur les versions rÃ©ellement installÃ©es.

| Domaine | Version | RÃ´le |
|---|---|---|
| Node.js | 24.15.0 | environnement |
| npm | 11.12.1 | dÃ©pendances |
| Expo | 57.0.25 | framework |
| Expo Router | 57.0.23 | navigation, point d'entrÃ©e |
| React Native | 0.86.3 | runtime |
| React | 19.2.3 | â€” |
| TypeScript | 6.0.3 | **mode `strict`**, aucun `any` |
| @supabase/supabase-js | 2.117.1 | client, Auth, RPC |
| @tanstack/react-query | 5.103.2 | Ã©tat serveur, distinction chargement / vide / erreur |
| zod | 4.6.5 | validation, messages en franÃ§ais |
| react-hook-form | 7.88.0 | formulaires |
| zustand | 5.0.15 | **installÃ©, inutilisÃ©** |
| @expo/vector-icons | 15.1.1 | icÃ´nes Material dans les onglets |

**Absents, et prÃ©vus par le plan :** `expo-notifications`, `expo-maps` ou
`react-native-maps`, `expo-location`, Stripe. Tous arrivent par les Ã©tapes 10 et
11. **Aucun n'est installÃ©** : rien n'est importÃ© par erreur.

**Configuration notable :** `experiments.reactCompiler` et `typedRoutes` sont
actifs dans `app.json` ; le plugin `expo-router` est dÃ©clarÃ©.

---

## Base de donnÃ©es

**PostgreSQL avec RLS sur les 13 tables du schÃ©ma `public`.** La rÃ©fÃ©rence
unique est `supabase/migrations/`, pas les fichiers `SUPABASE_SCHEMA_*.sql` de la
racine, qui divergent.

### Migrations

**[V]** 23 fichiers : `000001_reset_all.sql` (destructif) et 22 migrations datÃ©es
`20260925000100` Ã  `20260928002400`.

| Migration | Objet |
|---|---|
| `00100` | schÃ©ma, relations, triggers d'inscription |
| `00200` | 6 helpers RLS en `SECURITY DEFINER`, schÃ©ma `private` |
| `00300` | 32 politiques, 18 grants granulaires par colonne |
| `00400` | 8 transitions d'Ã©tat, cÃ´tÃ© serveur |
| `00500` | retrait du `FORCE RLS` sur `missions` et `mission_assignments` |
| `00600` | politique `insert` sur `mission_assignments` |
| `00700` | correction des triggers d'inscription, cassÃ©s par `FORCE` |
| `00900` | convergence du schÃ©ma |
| `01000` | restauration des clÃ©s Ã©trangÃ¨res |
| `01100` | rÃ©fÃ©rentiel `villes` â€” 8 villes, liste fermÃ©e |
| `01200` | restauration de la politique `insert` des affectations |
| `01300` | sonde de diagnostic â€” montÃ©e, puis retirÃ©e |
| `01400` | `DEFAULT auth.uid()` sur `missions.client_id` â€” **ABANDONNÃ‰E** |
| `01500` | **retrait de la sonde de diagnostic** |
| `01600` | trigger `BEFORE INSERT` qui impose `client_id` |
| `01800` | restauration des droits sur les fiches prestataires |
| `01900` | agents visibles par les clients |
| `02000` | annuaire des prestataires, `liste_agents_publics` |
| `02100` | sociÃ©tÃ©s visibles par les clients, `prestataires_par_ids` |
| `02200` | **matrice rÃ©parÃ©e** : `accepted` avait aucune sortie Â· `pointer_arrivee`, `pointer_depart` |
| `02300` | pointages **redeclares `volatile`** â€” voir dÃ©faut 8 |
| `02400` | `cloturer_mission` : mission **et** affectations, en une opÃ©ration |

> **[X] NumÃ©rotation trouÃ©e : `00800` et `01700` n'existent pas.** Sans
> consÃ©quence connue, mais Ã  confirmer â€” migration supprimÃ©e ou jamais Ã©crite ?

> âš ï¸ **`000001_reset_all.sql` est un outil destructif** rangÃ© **avant** la
> chaÃ®ne. Son exÃ©cution **aprÃ¨s** une migration a crÃ©Ã© le dÃ©faut P1b. Tout
> fichier destructeur passe avant les migrations, jamais aprÃ¨s.

### Les 13 tables et leur usage rÃ©el

**[V]** Six tables n'ont **aucune rÃ©fÃ©rence** dans le code client :

| UtilisÃ© par l'application | Jamais utilisÃ© |
|---|---|
| `profiles`, `profile_roles`, `agent_profiles`, `company_profiles`, `missions`, `mission_assignments`, `villes` | **`documents`, `wallets`, `transactions`, `reviews`, `messages`, `notifications`** |

> Le schÃ©ma est conÃ§u pour une application nettement plus vaste que celle qui
> existe. Six tables attendent un Ã©cran qui n'est pas Ã©crit â€” c'est normal, ce
> sont les Ã©tapes 7 Ã  11.

### ContrÃ´les

**[V]** `supabase/verification/` â€” 8 fichiers de contrÃ´le et de guide.

| Fichier | RÃ´le |
|---|---|
| `VERIFICATION_RAPIDE.sql` | **26 contrÃ´les**, un seul `SELECT`, un seul verdict |
| `VERIFICATION_POST_MIGRATION.sql` | 19 contrÃ´les dÃ©taillÃ©s, un par un |
| `LISTE_POLITIQUES.sql`, `DIAGNOSTIC_ETAT.sql`, `ETAT_DROILS_AGENT.sql` | diagnostics |
| `MIGRATIONS_EN_ATTENTE.md` â†’ *Ã‰TAT DE LA BASE* | âœ… **Ã  jour** â€” 26/26, aucune migration en attente |
| `GUIDE_APPLICATION_MIGRATIONS.md`, `RECONSTRUCTION_BASE.md` | â›” **pÃ©rimÃ©s**, bandeau d'avertissement en tÃªte |

> âš ï¸ **`MIGRATIONS_EN_ATTENTE.md` prescrivait d'appliquer `01200`, dÃ©jÃ 
> appliquÃ©e.** Le 2026-09-28 il a Ã©tÃ© rÃ©Ã©crit : il annonÃ§ait un dÃ©faut qui
> n'existait plus, et ignorait les quatre migrations du jour. **VÃ©rifiÃ© le
> 2026-09-28.**
>
> Un document pÃ©rimÃ© qui renvoie Ã  un document pÃ©rimÃ© est un piÃ¨ge Ã  deux
> Ã©tages. Les deux fichiers portaient un bandeau Â« â›” PÃ‰RIMÃ‰ Â» correct â€” mais
> tous deux renvoyaient vers celui-ci **en le croyant Ã  jour**. C'est lui qui
> mentait. La chaÃ®ne entiÃ¨re devait Ãªtre revue, pas seulement la feuille.

### Machines Ã  Ã©tats

**[V]** 11 RPC `SECURITY DEFINER`, accordÃ©es Ã  `authenticated` et rÃ©voquÃ©es pour
`anon`. Le client n'Ã©crit **jamais** un statut.

**Mission** â€” `draft`, `published`, `accepted`, `in_progress`, `completed`,
`cancelled`, `disputed`, `paid`

| Transition | RPC |
|---|---|
| publier | `publish_mission` |
| annuler | `cancel_mission` |
| clÃ´turer **(mission + affectations)** | `cloturer_mission` |
| marquer payÃ©e | `mark_mission_paid` |
| ouvrir un litige | `open_mission_dispute` |

> `complete_mission` existe toujours dans le catalogue, mais **plus rien ne
> l'appelle**. Elle ne fait avancer que la mission : c'est exactement ce qui
> laissait le client avec Â« TerminÃ©e Â» sur le badge et Â« AcceptÃ©e Â» sur
> l'affectation. `cloturer_mission` la remplace et fait les deux dans la mÃªme
> opÃ©ration.

**Affectation** â€” `pending`, `accepted`, `rejected`, `completed`

| Transition | RPC |
|---|---|
| accepter | `accept_assignment` |
| refuser | `reject_assignment` |
| terminer | `complete_assignment` â€” **jamais appelÃ©e** |
| **pointer l'arrivÃ©e** | `pointer_arrivee` â€” fait aussi passer la mission `in_progress` |
| **pointer le dÃ©part** | `pointer_depart` â€” emporte le rapport, **ne clÃ´ture rien** |

> `complete_assignment` exige l'**agent affectÃ©** comme acteur, donc le client ne
> peut pas l'appeler. C'est pourquoi `cloturer_mission` fait le travail des deux
> cÃ´tÃ©s, et pourquoi l'affectation ne peut plus rester `accepted` aprÃ¨s la
> clÃ´ture de la mission.
>
> `pointer_depart` ne clÃ´ture pas la mission : c'est une **dÃ©cision mÃ©tier**.
> L'agent termine SA vacation, le client â€” seul juge de ce qui a Ã©tÃ© fait â€”
> confirme. Un agent qui pourrait clore pourrait le faire avant l'heure, et le
> temps facturÃ© s'arrÃªterait.

**Prestataire** â€” **[D]** sept valeurs, dont `registered` et `validated`
confirmÃ©es par la politique de `01900`. Le plan enchaÃ®ne inscription â†’ documents
soumis â†’ en validation â†’ validÃ© / rejetÃ© â†’ actif â†’ suspendu ; l'Ã©cran
d'administration correspondant n'existe pas.

### Ce que les contrÃ´les ne prouvent pas

**[V]** `check:supabase` ne teste **que le rÃ´le `anon`**. Une politique qui ferme
Ã  un client ferme aussi Ã  `anon` : les deux cas sont indiscernables de
l'extÃ©rieur. Le script le dit lui-mÃªme, et c'est la rÃ¨gle de `AGENTS.md` qu'il
faut appliquer Ã  tout contrÃ´le ajoutÃ©.

---

## Authentification

**Supabase Auth, session persistante, multi-rÃ´le.** ValidÃ© Ã  l'Ã©cran le
2026-09-27.

| Ã‰lÃ©ment | Ã‰tat | Preuve |
|---|---|---|
| `signUp` / `signIn` / `signOut` / `getSession` | âœ… | **[V]** exÃ©cutÃ©s Ã  l'Ã©cran |
| Session persistante aprÃ¨s redÃ©marrage | âœ… | **[V]** `expo-secure-store` + `StartupGate` |
| `getUser()` **cÃ´tÃ© serveur** | âœ… | **[V]** `lib/supabase/auth.ts` â€” jamais la session locale pour dÃ©cider d'une identitÃ© |
| `AuthContext` centralise `session`, `user`, `profile`, `roles`, `loading`, `error`, `isServiceIssue` | âœ… | **[V]** `src/context/AuthContext.tsx` |
| Multi-rÃ´le lu correctement | âœ… | **[V]** fusion de `profiles.role` et `profile_roles`, dÃ©dupliquÃ©e par `Set` |
| Erreurs techniques **jamais** affichÃ©es | âœ… | **[V]** `toUserFacingError()` ; le dÃ©tail part dans `technicalDetail` |
| `StartupGate` vers `role-selection` si `roles.length > 1` | âœ… | **[V]** |
| Choix d'espace en multi-rÃ´le **persistÃ©** | âŒ | **[V]** absent â€” perdu Ã  chaque lancement |
| Attribution d'un second rÃ´le | âŒ | **[V]** aucun parcours ne le permet |
| VÃ©rification de compte | âŒ | **[V]** aucun Ã©cran ni service |

> **SÃ©curitÃ©.** `ProtectedRoute` et `StartupGate` sont une **aide d'interface**,
> pas une barriÃ¨re. La barriÃ¨re est la RLS. Un utilisateur peut contourner le
> routage en appelant l'API directement. Ne jamais les prÃ©senter comme une
> protection.

---

## Navigation

**Expo Router**, groupes de fichiers, un `Stack` racine unique.

```
src/app/_layout.tsx
  â””â”€ SafeAreaProvider        â† obligatoire : sans lui, useSafeAreaInsets()
  â”‚                            renvoie { top: 0 } et les SafeAreaView
  â”‚                            ne protÃ¨gent rien
  â””â”€ QueryClientProvider
     â””â”€ AuthProvider
        â””â”€ Stack (headerShown: false)
           â”œâ”€ index.tsx            â†’ StartupGate
           â”œâ”€ welcome.tsx          â†’ accueil public
           â”œâ”€ (startup)/           â†’ onboarding, profile-selection
           â”œâ”€ (auth)/              â†’ sign-in, sign-up, role-selection
           â”œâ”€ (client)/  (agent)/  (company)/  (admin)/
```

**[V]** Chaque groupe protÃ©gÃ© est enveloppÃ© par `ProtectedRoute`, qui vÃ©rifie
`requireAuth` et `requireRole`.

**[V]** Barres d'onglets unifiÃ©es par `src/components/navigation/tabBarOptions.ts` :
icÃ´nes Material, filet cyan, ombre, police de libellÃ©. Les emojis des onglets
ont Ã©tÃ© supprimÃ©s.

**[V]** `experiments.typedRoutes` est actif : les routes sont vÃ©rifiÃ©es Ã  la
compilation. C'est une garantie rÃ©elle contre les fautes de frappe dans les
`router.push`.

---

## FonctionnalitÃ©s dÃ©veloppÃ©es

### ValidÃ©es Ã  l'exÃ©cution **[V]**

| FonctionnalitÃ© | Preuve |
|---|---|
| DÃ©marrage de l'application | export web, **39 entrÃ©es de route** |
| Chargement des polices avant le splash | 8 graisses, splash bloquÃ© |
| Navigation par onglets, 4 espaces | icÃ´nes Material rendues |
| Inscription, connexion, dÃ©connexion | exÃ©cution Ã  l'Ã©cran le 2026-09-27 |
| Session persistante | `expo-secure-store` |
| Ouverture de la ville | `SelectVille` : liste fermÃ©e, recherche, sÃ©lection |
| **CrÃ©ation d'une mission** | mission crÃ©Ã©e depuis l'Ã©cran, valeurs en base |
| **Fiche agent : crÃ©ation** | ligne Ã©crite en base |
| **Fiche agent : modification** | valeurs relues en base |
| **Recherche de prestataires** | agent retrouvÃ© par un compte client |
| **Publication d'une mission** | RPC `publish_mission` â€” premiÃ¨re transition jamais exÃ©cutÃ©e, **rÃ©ussie** |
| **RÃ©servation d'un prestataire** | 2 affectations crÃ©Ã©es, `status = pending`, mission `published` |
| Validation des formulaires | Zod, messages en franÃ§ais |
| Ã‰tats pending / error / vide distincts | TanStack Query, trois rendus sÃ©parÃ©s |
| Traduction des erreurs | `errors.ts` : aucun message technique affichÃ© |

### CodÃ©es, jamais exÃ©cutÃ©es **[X]**

| FonctionnalitÃ© | Pourquoi c'est un risque |
|---|---|
| `acceptAssignment`, `rejectAssignment` | **jamais exÃ©cutÃ©es** â€” l'affectation reste `pending` sans fin |
| `getAgentMissions` | imbrique `missions(...)` : le motif qui a cassÃ© deux fois, jamais exÃ©cutÃ© |
| `checkIn`, `checkOut`, rapport | Ã©tape 7 |
| `updateMission` | colonnes restreintes par le `grant update` |

> Ces fonctions sont **compilantes et non testÃ©es**. Un code qui compile n'a
> jamais Ã©tÃ© exÃ©cutÃ©. Elles n'ont pas davantage de preuve d'exister que le
> `VERIFICATION_RAPIDE.sql` cassÃ©.

### Ã‰crans vides â€” aucune fonctionnalitÃ© **[V]**

**6 gestionnaires `onPress={() => {}}` restants, et 2 Ã©crans Â« BientÃ´t
disponible Â».**

*DÃ©compte refait le 2026-09-29 par recherche sur l'ensemble du dÃ©pÃ´t. Le
tableau prÃ©cÃ©dent annonÃ§ait 10 gestionnaires et 3 Ã©crans Â« BientÃ´t
disponible Â» : il Ã©tait pÃ©rimÃ©, et les trois Ã©crans agent qu'il citait
(`index`, `missions`, `availability`) sont en rÃ©alitÃ© implÃ©mentÃ©s et
interrogent la base.*

| Ã‰cran | Constat |
|---|---|
| `(company)/index.tsx` | 2 boutons vides |
| `(company)/missions.tsx` | 1 bouton vide |
| `(company)/team.tsx` | 1 bouton vide |
| `(admin)/index.tsx` | 2 boutons vides |
| `(admin)/users.tsx` | Â« BientÃ´t disponible Â» |
| `(admin)/missions.tsx` | Â« BientÃ´t disponible Â» |
| 2 Ã— `profile.tsx` (company, admin) | statiques |

> **Aucune requÃªte de donnÃ©es** dans les espaces sociÃ©tÃ© et administrateur.
> L'espace agent est le seul Ã  Ãªtre entiÃ¨rement reliÃ©.

### Accueil agent reconstruit â€” 2026-09-29

`src/app/(agent)/index.tsx` a Ã©tÃ© reconstruit depuis
`design/secuguard_accueil_agent_ind_pendant.html`. Il ne contient plus aucun
gestionnaire vide.

**VÃ©rifiÃ© `[V]` :**

| Point | Preuve |
|---|---|
| Le fichier compile | `npx tsc --noEmit` vide |
| Le code est conforme aux rÃ¨gles | `npx eslint .` vide, dÃ©pÃ´t entier |
| Le schÃ©ma est intact | `check:supabase` : `RESULTAT : conforme` |
| Aucune donnÃ©e en dur | tous les compteurs viennent d'une lecture |

**Ã‰crans alimentÃ©s par la base :**

| Bloc | Source |
|---|---|
| IdentitÃ©, zone, agrÃ©ment | `profiles`, `agent_profiles.zone`, `certification_number` |
| Demandes, terminÃ©es, reÃ§ues | `mission_assignations` filtrÃ©es par statut |
| Vacation en cours | `accepted` **avec** `check_in_time` et **sans** `check_out_time` |
| Solde et sÃ©questre | `wallets.balance`, `wallets.blocked_balance` |
| Tarif horaire | `agent_profiles.hourly_rate`, masquÃ© s'il est nul |
| Bascule de disponibilitÃ© | mutation `useChangerDisponibilite` |

**Ã‰carts assumÃ©s avec la maquette `[V]` :**

La maquette est un poste de supervision ; l'application est une place de
marchÃ©. Les blocs suivants ont Ã©tÃ© **retirÃ©s plutÃ´t que simulÃ©s**, parce que le
modÃ¨le ne contient aucune donnÃ©e capable de les remplir :

- Â« NFC Â», Â« Waze Â», Â« Astreinte Â», Â« 14 PC de sÃ©curitÃ© Â» ;
- Â« Cumul net avant prÃ©lÃ¨vement Â» et Â« Taux horaire moy. Â» â€” supposeraient une
  rÃ¨gle de commission, qui relÃ¨ve de l'Ã©tape 10 ;
- le montant Â« 220 â‚¬ Â» des missions en direct, affichÃ© **uniquement** si
  `proposed_rate` le porte.

`missions.budget` est un budget global saisi par le client, pas un prix ferme :
l'utiliser comme montant affichÃ© porterait dÃ©jÃ  une dÃ©cision de facturation
qui n'est pas prise.

**SupposÃ© `[X]`, non vÃ©rifiÃ© :**

- **Le rendu Ã  l'Ã©cran de cet accueil n'a pas Ã©tÃ© exÃ©cutÃ©.** Les vÃ©rifications
  sont statiques. Un Ã©cran peut compiler, passer le lint, et planter au premier
  rendu sur une donnÃ©e de forme inattendue.
- Il faudra une **session agent rÃ©elle** pour valider l'affichage des trois
  Ã©tats : compte sans fiche, compte avec fiche, compte avec demandes en attente.
- L'Ã©cran **affiche que** `wallets` est en lecture seule. Il n'a aucun moyen de
  modifier un solde, et le dit Ã  l'Ã©cran plutÃ´t que d'exposer un bouton
  inopÃ©rant.

---

### ExÃ©cution de mission par l'agent â€” 2026-09-29

`src/app/(agent)/mission/[id].tsx`, reconstruit depuis
`design/secuguard_ex_cution_mission_agent.html`. Le fichier Ã©tait **restÃ© Ã 
moitiÃ© Ã©crit** â€” il s'arrÃªtait sur un marqueur `//__SUITE__`, au milieu d'un
JSX non fermÃ©. `tsc` et `eslint` le signalaient depuis le dÃ©but de la session ;
il n'avait jamais Ã©tÃ© exÃ©cutÃ©.

**VÃ©rifiÃ© `[V]` :**

| Point | Preuve |
|---|---|
| Le fichier compile | `npx tsc --noEmit` vide |
| Le code est conforme aux rÃ¨gles | `npx eslint .` vide, dÃ©pÃ´t entier, **0 avertissement** |
| La route se construit et se prÃ©-rend | `npx expo export` â†’ `/(agent)/mission/[id] (25KB)` |
| L'Ã©cran est atteignable | bouton Â« Ouvrir le poste Â» (accueil), Â« Ouvrir la mission Â» (liste) |
| Ce n'est pas un onglet fantÃ´me | `href: null` dÃ©clarÃ© dans `(agent)/_layout.tsx` |

**Ce qui vient de la base :**

| Bloc | Source |
|---|---|
| Ã‰tat du poste et chrono | `check_in_time`, `check_out_time` â€” le chrono est **figÃ©** au dÃ©part |
| **DurÃ©e prÃ©vue `/ 10h00`** | `end_time - start_time` du client, avec Â« Â· dÃ©passÃ©e Â» si l'arrivÃ©e est postÃ©rieure Ã  la fin |
| IdentitÃ©, adresse, crÃ©neau | mission imbriquÃ©e dans `getAgentMissions()` |
| Statut de la mission | imbriquÃ© â€” c'est le seul endroit oÃ¹ l'agent voit que son pointage l'a fait passer `in_progress` |
| **Journal de vacation** | `created_at`, `check_in_time`, `check_out_time` â€” les 3 seuls horodatages existants |
| **Consignes du client** | `description` + `special_requirements`, rÃ©unies et remontÃ©es, liserÃ© ambre |
| Rapport | `mission_assignments.report`, en modification pendant la vacation |
| Zone et tarif | `agent_profiles`, **sans aucun montant calculÃ©** |

**Trois dÃ©cisions, et leurs raisons :**

1. **Aucune migration n'a Ã©tÃ© nÃ©cessaire.** `description` et
   `special_requirements` manquaient Ã  la sÃ©lection de `getAgentMissions` : ce
   n'Ã©tait pas un droit absent. `grant select` sur `missions` est au niveau
   table, et `private.can_view_mission` ouvre la mission Ã  l'agent affectÃ© dÃ¨s
   `pending`. **La RLS filtre des lignes, pas des colonnes.**
2. **Le rapport peut Ãªtre enregistrÃ© avant le dÃ©part.** C'est la seule Ã©criture
   directe d'un Ã©cran dans ce projet, et elle porte sur `report` seul : la
   colonne est dans le `grant update` de `00300`, la politique Â« Assigned agents
   can update mission reports Â» n'ouvre la ligne qu'Ã  l'agent affectÃ©, et le
   **contrÃ´le 23** mesure ce droit en excluant explicitement `status`. Sans
   elle, un rapport Ã©crit Ã  la premiÃ¨re heure d'une vacation de dix heures
   disparaissait au premier verrouillage du tÃ©lÃ©phone.
3. **Pas de confirmation avant le dÃ©part.** `Alert.alert` n'est pas fiable sous
   `react-native-web`, et une confirmation qui ne s'affiche pas transforme le
   bouton en bouton mort. Le libellÃ© dit ce qu'il fait : Â« Pointer mon dÃ©part et
   envoyer le rapport Â».

**Le rendu mobile de la maquette a Ã©tÃ© confrontÃ© Ã  l'Ã©cran, bloc par bloc.**
Sept blocs de `secuguard_ex_cution_mission_agent.html` sur douze n'ont aucune
source de donnÃ©es â€” NFC, rondes, PTI, batterie, MCE, camÃ©ra, code de portail.
Ils restent retirÃ©s. **Trois blocs rÃ©els leur ont Ã©tÃ© ajoutÃ©s :**

| Ajout | Ce qui remplace quoi |
|---|---|
| `/ 10h00` dans la pastille du chrono | le Â« / 10h00 Â» de la maquette, calculÃ© sur `end_time - start_time` |
| **Journal de vacation** | le Â« Journal d'Ã‰vÃ©nements (MCE) Â», rÃ©duit aux 3 horodatages qui existent |
| **Consignes du client** | les cartes Â« Description Â» et Â« Consignes du site Â», rÃ©unies et remontÃ©es |

**Le retard est annoncÃ© par le texte ET par la couleur**, jamais par la couleur
seule : Â« Â· dÃ©passÃ©e Â» en ambre pÃ¢le, lisible sur le navy et par un lecteur
d'Ã©cran. Un signal inaccessible est un signal absent.

**`updated_at` n'est pas utilisÃ© dans le journal**, volontairement : il bouge Ã 
chaque Ã©criture, y compris Ã  chaque pointage, et un journal bÃ¢ti dessus
mentirait sur l'heure de ses propres lignes.

**L'Ã©cart avec la maquette est Ã©crit Ã  l'Ã©cran**, sous le journal comme sous les
consignes : Â« le modÃ¨le ne conserve aucun Ã©vÃ©nement horodatÃ© Â», Â« le modÃ¨le ne
leur rÃ©serve aucune colonne Â». Un bloc manquant sans explication se lit comme un
bug ; avec elle, il se lit comme une limite.

**RefusÃ©, et dit ici pour que ce soit tranchÃ© :** `expo-battery` pour le
Â« 94 % Â», et une table `mission_events` pour un vrai journal horodatÃ©. Le
premier rendrait Â« inconnue Â» sur le web â€” donc la preuve n'existerait que sur
mobile. Le second est un choix de modÃ¨le, pas un Ã©cran, et il appartient Ã 
l'Ã©tape 11.

**Un dÃ©faut corrigÃ© au passage `[V]` :** le brouillon du rapport Ã©tait rÃ©initialisÃ©
par un `useEffect` dÃ©pendant de `report`. Chaque invalidation du cache effaÃ§ait
donc la saisie en cours. La rÃ©initialisation ne porte plus que sur un
**changement d'affectation**, et se fait pendant le rendu.

**RetirÃ© de la maquette, faute de source `[V]` :** Â« Matricule AG-7842 Â» (aucune
colonne), Â« Batterie GPS 94 % Â» (`expo-battery` absent), Â« Dispositif PTI
ARMÃ‰ Â», Â« Scan NFC ValidÃ© Â» (`expo-nfc` absent), les rondes et leurs points de
passage (aucune table), le Â« Journal d'Ã‰vÃ©nements (MCE) Â» horodatÃ© (aucun
historique), l'aperÃ§u camÃ©ra (`expo-camera` absent), le code de portail et le
tÃ©lÃ©phone du responsable (aucune colonne), et la partie SOS, Ã  la demande du
commanditaire. **Aucun n'est simulÃ©.**

**SupposÃ© `[X]`, non vÃ©rifiÃ© :**

- **Aucun rendu Ã  l'Ã©cran.** `tsc`, `eslint` et `expo export` sont des preuves
  de construction, pas de fonctionnement. Un `getAgentMissions()` jamais
  exÃ©cutÃ© peut renvoyer une forme inattendue.
- `pointer_arrivee`, `pointer_depart`, `accept_assignment` et
  `reject_assignment` **restent non exÃ©cutÃ©s**. L'Ã©cran ne fait qu'ajouter des
  boutons Ã  des fonctions dont le comportement n'a jamais Ã©tÃ© observÃ©.
- **La nouvelle Ã©criture sur `report` n'a pas Ã©tÃ© exÃ©cutÃ©e non plus.** Le
  contrÃ´le 23 mesure le droit, jamais l'Ã©criture.

---

### Ã‰tape 12 â€” amorcÃ©e

- **[V]** `scripts/test-parcours.js` : joue le parcours complet avec **deux
  comptes rÃ©els**, 13 Ã©tapes, dont **5 cas nÃ©gatifs**
- **[X]** **Jamais exÃ©cutÃ©** â€” il exige deux couples email / mot de passe, dans
  un `.env.test` ignorÃ© par git. C'est le premier test automatique du projet,
  et son premier rÃ©sultat est encore inconnu
- **[V]** BloquÃ© le 2026-09-29 : dans `.env.test`, seul `TEST_AGENT_EMAIL` est
  renseignÃ©. Les deux mots de passe et l'email client sont vides
- **[V]** Ne couvre pas l'Ã©criture directe sur `report` avant le dÃ©part
- **[X]** Aucun test unitaire, aucun test d'intÃ©gration

**Pourquoi ce fichier existe :** les dix dÃ©fauts ont tous survÃ©cu Ã  des
contrÃ´les qui mesurent l'Ã©tat de la base. Ce test mesure ce que la base **fait**.
C'est la seule famille de contrÃ´le qui aurait pu les voir.

---

## FonctionnalitÃ©s restantes

### Ã‰tape 6 â€” codÃ©e, un test la sÃ©pare de Â« terminÃ©e Â»

- **[V]** SÃ©lection : carte actionnable, Ã©cran de rÃ©servation
- **[V]** RÃ©servation : publication et `createAssignment`
- **[V]** Suivi : voir la mission et son prestataire
- **[V]** ClÃ´ture : `cloturer_mission`, mission et affectations ensemble
- **[X]** **Test fonctionnel de bout en bout** â€” seul obstacle restant

### Ã‰tape 7 â€” codÃ©e en entier, **rien n'est vÃ©rifiÃ© Ã  l'Ã©cran**

- **[V]** Documents justificatifs â€” table `documents` existante, aucun Ã©cran
- **[V]** DisponibilitÃ©s â€” `is_available` existe dans le schÃ©ma
- **[V]** RÃ©ception et liste des missions
- **[V]** Acceptation et refus
- **[V]** Check-in / check-out et rapport
- **[V]** Ã‰cran d'exÃ©cution `(agent)/mission/[id]`, **atteignable** depuis
  l'accueil et la liste, et **prÃ©-rendu par `expo export`**
- **[X]** **Aucun de ces Ã©crans n'a Ã©tÃ© ouvert.** C'est le mÃªme vide que
  l'Ã©tape 6, mais ici il porte sur tout le parcours agent.

### Ã‰tapes 8 Ã  13

| Ã‰tape | Contenu | Blocage |
|---|---|---|
| 8 â€” SociÃ©tÃ© | profil, Ã©quipe, agents, missions, affectations | modÃ¨le d'agent salariÃ© non modÃ©lisÃ© |
| 9 â€” Admin | validation des comptes, documents, utilisateurs, missions, litiges | aucun Ã©cran |
| 10 â€” Paiement | Stripe, commission, transactions, webhooks, wallet | **prestataire et taux non confirmÃ©s** |
| 11 â€” Temps rÃ©el | localisation, suivi, chat, notifications | **cartographie non choisie** |
| 12 â€” QualitÃ© | tests, sÃ©curitÃ©, performances, audit | **`test:parcours` Ã©crit, jamais exÃ©cutÃ©** |
| 13 â€” Production | builds, environnement de production, monitoring | â€” |

---

## ProblÃ¨mes rencontrÃ©s

**Dix dÃ©fauts ont survÃ©cu Ã  une chaÃ®ne de contrÃ´les entiÃ¨rement verte.** Aucun
n'Ã©tait dÃ©tectable de l'extÃ©rieur. Ils sont listÃ©s par gravitÃ©, avec la cause
**Ã‰TABLIE** ou **NON Ã‰TABLIE** â€” et une cause non Ã©tablie n'est jamais inventÃ©e.

### Les dix dÃ©fauts invisibles

| # | DÃ©faut | Pourquoi aucun contrÃ´le ne le voyait | Cause |
|---|---|---|---|
| 1 | `mission_assignments` sans politique `insert` | le contrÃ´le 12 le voyait ; le **bilan global** annonÃ§ait Â« conforme Â» | **[V] Ã‰TABLIE** |
| 2 | `DEFAULT auth.uid()` de `01400` | le contrÃ´le 18 mesurait sa **prÃ©sence**, jamais son **moment d'Ã©valuation** | **[V] Ã‰TABLIE** |
| 3 | `grant select` absent sur `agent_profiles` | le contrÃ´le ne demandait que les `INSERT` | **[V] Ã‰TABLIE** |
| 4 | `profiles!inner(full_name, city, postal_code)` | **aucun contrÃ´le n'existait** ; et `profiles` n'a ni `city` ni `postal_code` | **[V] Ã‰TABLIE** |
| 5 | politique de lecture des agents fermÃ©e aux clients | **aucun contrÃ´le n'existait** ; invisible aussi Ã  `check:supabase`, qui ne teste que `anon` | **[V] Ã‰TABLIE** |
| 6 | **`company_profiles` fermÃ©e aux clients** | le contrÃ´le 21 ne regarde que `agent_profiles` â€” la table que `01900` venait de corriger | **[V] Ã‰TABLIE** |
| 7 | matrice sans ligne `accepted` | la fonction **existait** et ses droits Ã©taient accordÃ©s : rien ne signalait une transition manquante | **[V] Ã‰TABLIE** |
| 8 | pointages dÃ©clarÃ©s `STABLE` | le contrÃ´le mesurait l'**existence** et les droits â€” jamais la **volatilitÃ©** | **[V] Ã‰TABLIE** |
| 9 | mission et affectation closes par deux acteurs diffÃ©rents | chaque statut Ã©tait juste, et aucun contrÃ´le ne les comparait | **[V] Ã‰TABLIE** |
| 10 | `pointer_depart` Ã  deux paramÃ¨tres | le **diagnostic** envoyait un seul argument : il s'accusait lui-mÃªme, et le contrÃ´le 25 ne teste que `proname` | **[V] Ã‰TABLIE** |

**Le motif est toujours le mÃªme :** une politique qui ferme Ã  un client ferme
aussi Ã  `anon`, donc le contrÃ´le automatique ne peut pas la voir. Une base
conforme n'est pas une base correcte.

**Le dÃ©faut 6 est le plus instructif**, parce qu'il est **nÃ© d'un correctif** :
`01900` a ouvert `agent_profiles` aux clients en 2026-09-27, et le contrÃ´le 21,
Ã©crit le mÃªme jour, n'a vÃ©rifiÃ© que cette table. `company_profiles` est restÃ©e
fermÃ©e depuis le dÃ©but. RÃ©sultat : **la recherche n'a jamais affichÃ© une
sociÃ©tÃ©**, et le test du 2026-09-27 a trouvÃ© un agent â€” on cherchait un agent, on
a trouvÃ© un agent.

> Un contrÃ´le Ã©crit au mÃªme moment qu'un correctif valide naturellement ce que
> ce correctif vient de faire. Ce qu'il ne fait pas, c'est vÃ©rifier ce qu'il
> n'a pas touchÃ©. La couverture d'un contrÃ´le doit suivre l'inventaire, pas
> l'ordre des travaux.

### P1 â€” crÃ©ation d'une mission refusÃ©e

**SymptÃ´me :** `new row violates row-level security policy for table "missions"`.

**Cause racine : [X] NON Ã‰TABLIE.** C'est le point le plus instructif du projet,
et il n'est pas clos.

Sept conditions ont Ã©tÃ© vÃ©rifiÃ©es **vraies, dans la mÃªme exÃ©cution que
l'insertion qui Ã©choue** : la politique `insert`, `auth.uid()`, le `client_id`
envoyÃ©, le `status`, les droits accordÃ©s, l'absence de trigger, `FORCE RLS` levÃ©,
aucune politique `RESTRICTIVE`. La ligne satisfait la clause et PostgreSQL la
refuse quand mÃªme.

**Ce qui a Ã©tÃ© Ã©liminÃ© :** la cause n'Ã©tait pas dans le schÃ©ma. Un `INSERT`
identique exÃ©cutÃ© dans le SQL Editor, en rÃ´le `authenticated`, avec le mÃªme
jeton, rÃ©ussit. Le dÃ©faut est dans la **maniÃ¨re dont l'application Ã©met la
requÃªte**, pas dans la base.

**Le mÃ©canisme, mesurÃ© :** `.insert().select()` envoie
`Prefer: return=representation`. PostgREST insÃ¨re la ligne, puis la **relit** â€”
et cette relecture est soumise Ã  la politique de SELECT, donc Ã  un
`SECURITY DEFINER` qui interroge trois tables. La preuve est la comparaison de
deux requÃªtes identiques dont seul l'en-tÃªte diffÃ¨re :

```
return=minimal         -> 201   l'Ã©criture passe
return=representation  -> 403   la relecture Ã©choue
```

**Pourquoi `DEFAULT auth.uid()` ne pouvait pas marcher :** un `DEFAULT` n'est pas
de la donnÃ©e ; PostgreSQL l'Ã©value en **prÃ©parant** l'instruction. Via PostgREST,
cette prÃ©paration a lieu dans le rÃ´le *prÃ©parÃ©*, **avant** l'installation du
jeton : `auth.uid()` y vaut `NULL`. La clause `client_id = auth.uid()` s'Ã©value
donc Ã  `NULL`, donc fausse, et la ligne est refusÃ©e â€” sans qu'aucune condition
de `WITH CHECK` ne soit fausse. `01600` dÃ©place l'Ã©criture au moment de
l'**exÃ©cution**, via un trigger `BEFORE INSERT`.

### Les autres incidents

| Incident | Cause | RÃ©solu |
|---|---|---|
| Panne Â« AccÃ¨s indisponible / 42501 Â» | **[V] Ã‰TABLIE** â€” `anon` n'avait pas `USAGE` sur le schÃ©ma `public` ; l'erreur Ã©tait levÃ©e **avant** toute Ã©valuation RLS | âœ… `00300` |
| Publication et acceptation inopÃ©rantes | **[V] Ã‰TABLIE** â€” `FORCE RLS` soumettait le propriÃ©taire aux politiques et cassait les fonctions `SECURITY DEFINER` | âœ… `00500` |
| Inscription impossible | **[V] Ã‰TABLIE** â€” mÃªme cause, sur les triggers d'inscription | âœ… `00700` |
| P1b â€” politique d'insertion disparue | **[V] Ã‰TABLIE** â€” `DROP TABLE ... CASCADE` de `000001_reset_all.sql` exÃ©cutÃ© **aprÃ¨s** `00600` : il a supprimÃ© la politique et les droits, **pas** la fonction, dont le corps n'est pas une dÃ©pendance suivie par PostgreSQL | âœ… `01200` |
| P2 â€” calendrier natif sur le web | **[V] Ã‰TABLIE** â€” `ChampDateHeure` n'utilisait que le composant natif | âœ… branche web |
| P3 â€” message d'erreur erronÃ© | **[V] Ã‰TABLIE** â€” traductions mal sÃ©parÃ©es dans `errors.ts` | âœ… `errors.ts` |
| P4 â€” cycle d'import `villes` | **[V] Ã‰TABLIE** â€” un composant exportÃ© par un baril importait ce mÃªme baril | âœ… import direct |
| P6 â€” doublon `villesService` | **[V] Ã‰TABLIE** â€” deux services au mÃªme rÃ´le | âœ… `listCities` |
| ContrÃ´le 4 en faux vert | **[V] Ã‰TABLIE** â€” seuil `>= 33`, trop lax pour voir l'Ã©cart de 4 politiques | âœ… seuil sur 37, dÃ©compte Ã©crit dans le contrÃ´le |
| ContrÃ´le 12 en faux rouge | **[V] Ã‰TABLIE** â€” cherchait `polcmd = 'i'`, valeur qui **n'existe pas** ; `insert` vaut `'a'` | âœ… corrigÃ© |
| ContrÃ´les 18 et 19 en faux rouge | **[V] Ã‰TABLIE** â€” mesuraient le design **abandonnÃ©** de `01400` | âœ… rÃ©Ã©crits sur `01600` |
| NÅ“ud texte vide dans un `View` | **[V] Ã‰TABLIE** â€” `''` est rendu comme nÅ“ud ; `null` et `false` ne le sont pas | âœ… `Boolean()` explicite |
| **`VERIFICATION_RAPIDE.sql` cassÃ©** | **[V] Ã‰TABLIE** â€” deux libellÃ©s entre guillemets **doubles**, qui dÃ©signent un identifiant et non une chaÃ®ne. Le script Ã©chouait en ligne 384 : **les contrÃ´les 1 Ã  17 ne s'affichaient plus** | âœ… 2026-09-28 |

---

## Solutions appliquÃ©es

| # | Solution | Fichiers |
|---|---|---|
| 1 | `client_id` retirÃ© du client ; trigger `BEFORE INSERT` en `SECURITY DEFINER` | `01600`, `useMissions.ts` |
| 2 | Politique d'insertion des affectations recrÃ©Ã©e, avec les droits | `01200` |
| 3 | Agents `registered` et `validated` rendus visibles aux clients | `01900` |
| 4 | Jointure `profiles` supprimÃ©e de la recherche ; nom lu par fonction | `02000`, `providers.service.ts` |
| 5 | `.select()` retirÃ© de `createMission` **et** de `createAssignment` | `missions.service.ts` |
| 6 | Erreurs techniques journalisÃ©es, jamais affichÃ©es | `lib/supabase/errors.ts` |
| 7 | DÃ©tail technique journalisÃ© **dÃ¨s l'erreur**, pas seulement au clic Â« RÃ©essayer Â» | `search.tsx` |
| 8 | Questions de rendu rendues explicites par `Boolean()` | `search.tsx` |
| 9 | Migrations rendues idempotentes et auto-vÃ©rifiÃ©es | `01200` et suivantes |
| 10 | `SafeAreaProvider` montÃ© Ã  la racine | `app/_layout.tsx` |
| 11 | `UNION ALL` partout : un `UNION` imbriquÃ© aurait fait perdre la moitiÃ© des contrÃ´les | `VERIFICATION_RAPIDE.sql` |
| 12 | ContrÃ´les **20** (droits d'Ã©criture) et **21** (visibilitÃ© des prestataires) ajoutÃ©s | `VERIFICATION_RAPIDE.sql` |

### La leÃ§on du projet

Sept incidents ont montrÃ© que **le code ne peut pas prouver son propre schÃ©ma**.
Quatre rÃ¨gles en dÃ©coulent, et elles s'appliquent Ã  tout contrÃ´le ajoutÃ© :

1. **Toute correction de base se valide par exÃ©cution**, jamais par lecture de
   fichier. La migration `00600` est parfaitement Ã©crite, et son effet a Ã©tÃ©
   dÃ©truit aprÃ¨s coup.
2. **Un diagnostic doit distinguer Â« protÃ©gÃ© Â» de Â« non configurÃ© Â».** Un `401`
   seul ne prouve rien : il peut signifier que la RLS filtre, ou qu'aucun droit
   n'a Ã©tÃ© accordÃ©.
3. **Un rapport distingue ce qui est vÃ©rifiÃ© de ce qui est supposÃ©.** C'est la
   raison d'Ãªtre des mentions **[V] / [D] / [X]**.
4. **Un contrÃ´le ne peut pas dÃ©tecter ce qu'il n'attend pas** â€” et un seuil trop
   lax est aussi trompeur qu'une absence de contrÃ´le.

> Le 2026-09-28, une cinquiÃ¨me variante est apparue : un contrÃ´le qui **ne
> rÃ©pond plus du tout**. `VERIFICATION_RAPIDE.sql` Ã©chouait en ligne 384, et
> l'Ã©chec supprimait l'affichage des 17 lignes prÃ©cÃ©dentes. Un contrÃ´le muet se
> lit pourtant comme un contrÃ´le passÃ© : il ne ment pas, il ne rÃ©pond pas.

---

## DÃ©cisions techniques

| DÃ©cision | Motif | Statut |
|---|---|---|
| TanStack Query plutÃ´t que `useState` | distinguer Â« chargement Â» de Â« vide Â», et invalider aprÃ¨s Ã©criture | **[V]** appliquÃ©e Ã  `missions`, `prestataires`, `villes` |
| `retry: 1` et non 3 | un Ã©chec de permission ne se corrige pas en rÃ©essayant | **[V]** appliquÃ©e |
| VÃ©rifications d'accÃ¨s en `SECURITY DEFINER` | une sous-requÃªte dans une politique s'exÃ©cute avec les droits du **rÃ´le appelant** | **[V]** 6 helpers dans le schÃ©ma `private` |
| Retirer `FORCE RLS` de `missions` et `mission_assignments` | `FORCE` soumet le propriÃ©taire aux politiques et casse les `SECURITY DEFINER` | **[V]** `00500` |
| Statuts par RPC uniquement | le client ne doit jamais Ã©crire un statut | **[V]** 8 transitions |
| Villes en liste fermÃ©e administrÃ©e | Ã©vite les variantes orthographiques et les missions hors zone | **[V]** `01100` |
| Erreurs techniques journalisÃ©es, jamais affichÃ©es | un message PostgreSQL brut rÃ©vÃ¨le tables, politiques et rÃ´les | **[V]** `errors.ts` |
| `client_id` imposÃ© par trigger, pas par le formulaire | empÃªche de crÃ©er une mission au nom d'autrui, et rÃ©siste Ã  une politique dÃ©faillante | **[V]** `01600` |
| Aucun `.select()` aprÃ¨s un `.insert()` | la relecture de `return=representation` Ã©choue, et l'Ã©chec est rapportÃ© comme un refus d'Ã©criture | **[V]** appliquÃ© Ã  `createMission` et `createAssignment` |
| Ville dans le formulaire, pas dans la fiche agent | `agent_profiles` n'a qu'un `zone` libre ; on ne fabrique pas une gÃ©ographie que personne n'a saisie | **[V]** documentÃ© dans `providers.service.ts` |
| Recherche en lecture seule jusqu'Ã  preuve d'Ã©criture | l'Ã©criture n'est validÃ©e que sur un seul parcours | **[V]** `providers.service.ts` porte Â« AUCUNE Ã‰CRITURE ICI Â» |
| ContrÃ´les auto-vÃ©rifiÃ©s dans les migrations | une migration Ã©choue bruyamment plutÃ´t que de laisser passer un demi-correctif | **[V]** `01200` |

### VisibilitÃ© rÃ©ciproque â€” rÃ¨gle confirmÃ©e le 2026-09-28

**Â« Tout client voit tout prestataire, et rÃ©ciproquement. Â»**

**Ce que le schÃ©ma fait AUJOURD'HUI, et qui n'est pas la mÃªme chose :**

| Sens | Ã‰tat rÃ©el | Preuve |
|---|---|---|
| client â†’ prestataire | **partiel** | `[V]` contrÃ´le 21 : politique ouverte, mais **seulement** `registered` et `validated` |
| prestataire â†’ client | **nul** | **[V]** politique `Profiles are viewable by owner or admin` : `id = auth.uid() or is_admin()` |
| prestataire â†’ missions | **uniquement celles qui lui sont affectÃ©es** | **[V]** `can_view_mission` exige une affectation existante |

**Deux points ne sont PAS tranchÃ©s par cette rÃ¨gle, et ils ne sont pas des dÃ©tails :**

1. **Â« Tout prestataire Â» inclut-il un profil `rejected` ou `suspended` ?**
   Ce serait une absurditÃ© fonctionnelle : le client verrait un agent dont la
   piÃ¨ce a Ã©tÃ© refusÃ©e, et l'administrateur aurait montÃ© un systÃ¨me de
   validation qui n'empÃªche rien. La lecture utile est Â« tout prestataire
   **utilisable** Â» : `registered` et `validated`.

2. **Jusqu'oÃ¹ va Â« voir Â» un client ?**
   `grant select` sur `public.profiles` est accordÃ© **au niveau table**
   (`01800`) : toutes les colonnes sont lisibles, et la RLS filtre les
   **lignes**, pas les colonnes. Ouvrir la politique revient donc Ã  donner Ã 
   chaque prestataire `email` et `phone` de **tous** les comptes clients.

   C'est un problÃ¨me de protection des donnÃ©es, pas d'architecture. La rÃ©ponse
   technique n'est pas de fermer la porte, mais de **rÃ©duire les colonnes** :
   annuaire par fonction serveur, comme `liste_agents_publics` le fait dÃ©jÃ 
   pour les agents.

> âš ï¸ **Rien n'est implÃ©mentÃ©.** La rÃ¨gle est inscrite, pas appliquÃ©e. Voir
> Â« Points Ã  confirmer Â» pour les deux dÃ©cisions qu'elle ouvre.


---

## Variables d'environnement

**[V]** `.env` prÃ©sent, ignorÃ© par Git. `.env.example` sans valeur.

| Variable | Nature | UtilisÃ©e par | Ã‰tat |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | publique | `lib/supabase/client.ts` | âœ… renseignÃ©e |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | publique | `lib/supabase/client.ts` | âœ… renseignÃ©e |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | publique | cartographie (Ã©tape 11) | â¬œ absente |
| `EXPO_PUBLIC_EXPO_PROJECT_ID` | publique | builds (Ã©tape 13) | â¬œ absente |
| `STRIPE_SECRET_KEY` | **serveur** | Edge Functions (Ã©tape 10) | â¬œ absente â€” **ne doit jamais Ãªtre cÃ´tÃ© mobile** |
| `STRIPE_WEBHOOK_SECRET` | **serveur** | validation des webhooks (Ã©tape 10) | â¬œ absente â€” **idem** |

**[V]** `client.ts` lÃ¨ve une erreur explicite si une variable publique manque.

**[V]** Aucun secret serveur dans le dÃ©pÃ´t. La clÃ© `service_role` n'y est pas, et
`README.md` l'interdit explicitement.

---

## Points Ã  confirmer

Ã‰lÃ©ments jamais inventÃ©s, jamais comblÃ©s par une supposition.

- **TODO â€” Ã€ CONFIRMER : pays / zone de lancement.** Les 8 villes de `01100`
  sont un exemple, pas une dÃ©cision.
- **TODO â€” Ã€ CONFIRMER : rÃ©glementation applicable et organisme d'agrÃ©ment.**
- **TODO â€” Ã€ CONFIRMER : prestataire de paiement, taux de commission, frais de
  transaction, dÃ©lai de libÃ©ration des fonds.** Bloque l'Ã©tape 10.
- **TODO â€” Ã€ CONFIRMER : cartographie.** Google Maps ou Mapbox. Bloque l'Ã©tape 11.
- **TODO â€” Ã€ CONFIRMER : modÃ¨le d'agent salariÃ©.** Le Â§Acteurs du plan dÃ©crit un
  agent salariÃ© rattachÃ© Ã  une sociÃ©tÃ©. **Aucun modÃ¨le de donnÃ©es ne le couvre** :
  `agent_profiles` n'a aucun lien vers `company_profiles`. Ã€ trancher **avant**
  l'Ã©tape 8.
- **TODO â€” Ã€ CONFIRMER : modÃ¨le de compte multi-rÃ´le.** Le plan autorise plusieurs
  rÃ´les par compte ; `AuthContext` les lit, mais **aucun parcours ne permet
  d'attribuer un second rÃ´le**, ni de mÃ©moriser l'espace choisi.
- **TODO â€” Ã€ CONFIRMER : mÃ©canisme de vÃ©rification de compte.** Aucun Ã©cran ni
  service n'existe. Or `01900` rend visible une fiche `registered` : la
  validation par un administrateur est un acte distinct, et l'Ã©cran
  correspondant n'est pas construit.
- **TODO â€” Ã€ CONFIRMER : border de `missions.city`.** ClÃ© Ã©trangÃ¨re vers
  `villes.nom`, ou contrainte applicative ? DÃ©cision de sÃ©curitÃ© en attente.
- **TODO â€” Ã€ CONFIRMER : pÃ©rimÃ¨tre de la visibilitÃ© rÃ©ciproque.** La rÃ¨gle
  Â« tout client voit tout prestataire, et rÃ©ciproquement Â» est confirmÃ©e, mais
  deux points restent ouverts :
  1. Un profil prestataire `rejected` ou `suspended` reste-t-il invisible ?
     **Recommandation : oui, invisible.** Le contraire viderait de son sens tout
     l'Ã©tape 9 (validation des comptes).
  2. Quelles colonnes d'un profil client un prestataire peut-il lire ?
     **Recommandation : `id`, `full_name`, `role`, `avatar_url` â€” jamais `email`
     ni `phone`.** Le `grant select` est au niveau table, donc la RLS seule ne
     peut pas protÃ©ger ces deux colonnes ; il faut un annuaire par fonction
     serveur.
- **TODO â€” Ã€ CONFIRMER : modÃ¨le fermÃ© ou appel d'offres.** Le prestataire ne
  voit que les missions qui lui sont affectÃ©es (modÃ¨le actuel, sans migration).
  Un tableau de bord public des missions publiÃ©es correspond Ã  un **appel
  d'offres**, que le plan liste parmi les fonctionnalitÃ©s ajoutÃ©es aprÃ¨s le
  MVP. **Recommandation : modÃ¨le fermÃ© pour l'Ã©tape 7.**


- **TODO â€” Ã€ CONFIRMER : dÃ©placement de `AuthContext` vers `features/auth/`.**
  Le plan place la logique mÃ©tier dans `features` ; ne pas le faire sans accord
  explicite.
- **TODO â€” Ã€ CONFIRMER : numÃ©rotation `00800` et `01700`.** Absentes de la
  chaÃ®ne. Migration supprimÃ©e, ou jamais Ã©crite ?

---

## Historique des modifications

| Date | Ã‰vÃ©nement |
|---|---|
| 2026-09-24 | CrÃ©ation du projet, structure initiale, page d'accueil |
| 2026-09-25 | Audit senior : authentification, rÃ´les, services, contrat `Database` |
| 2026-09-25 | `00300_rls_policies.sql` â€” 32 politiques, 18 grants |
| 2026-09-25 | `00400_state_transitions.sql` â€” 8 transitions d'Ã©tat serveur |
| 2026-09-26 | Panne Â« AccÃ¨s indisponible / 42501 Â». **Cause rÃ©elle :** `anon` sans `USAGE` sur le schÃ©ma `public` ; l'erreur prÃ©cÃ©dait toute Ã©valuation RLS |
| 2026-09-26 | `00500` : retrait du `FORCE RLS` sur `missions` et `mission_assignments` |
| 2026-09-26 | `00600` : politique `insert` sur `mission_assignments` |
| 2026-09-26 | `00700` : correction des triggers d'inscription, cassÃ©s par `FORCE` |
| 2026-09-26 | `000001_reset_all.sql` exÃ©cutÃ© **aprÃ¨s** `00600` â†’ **P1b**, effet non anticipÃ© |
| 2026-09-26 | Reconstruction complÃ¨te, `check:supabase` â†’ Â« conforme Â» |
| 2026-09-26 | `01100_villes.sql` : rÃ©fÃ©rentiel des villes |
| 2026-09-26 | Refonte visuelle : tokens Figma, polices, 6 primitives, accueil client |
| 2026-09-26 | **Premier test runtime** : 3 dÃ©fauts trouvÃ©s â€” P2 calendrier web, P3 message erronÃ©, P1 crÃ©ation de mission |
| 2026-09-26 | S1 Ã  S9 : typographie, `AppHeader`, onglets Material, branche web, `errors.ts`, cycle `villes`, doublon de service, contrats trop permissifs |
| 2026-09-26 | `01200` et `01300` Ã©crits, non appliquÃ©s |
| 2026-09-26 | Analyse exhaustive (69 fichiers) et rÃ©Ã©criture du rapport. Ancien rapport conservÃ© dans `docs_RAPPORT_HISTORIQUE_2026-09-26.md` |
| 2026-09-27 | `01500` appliquÃ©e : **la sonde de diagnostic est retirÃ©e de la production** |
| 2026-09-27 | `01600` appliquÃ©e : trigger `BEFORE INSERT` sur `missions.client_id`. **`01400` abandonnÃ©e** |
| 2026-09-27 | `01800` : restauration des droits sur les fiches prestataires |
| 2026-09-27 | `01900` : les agents deviennent visibles par les clients. **`02000`** : annuaire et `liste_agents_publics` |
| 2026-09-27 | **PremiÃ¨re validation fonctionnelle** : mission crÃ©Ã©e, fiche agent crÃ©Ã©e et modifiÃ©e, agent retrouvÃ© par un client |
| 2026-09-28 | **Diagnostic complet du dÃ©pÃ´t.** `typecheck`, `lint` et `npx eslint .` verts. Base distante mesurÃ©e : **19 contrÃ´les sur 19 au vert** Ã  ce stade |
| 2026-09-28 | **`VERIFICATION_RAPIDE.sql` rÃ©parÃ©** : deux libellÃ©s en guillemets doubles rendaient le script inexÃ©cutable depuis le 27/09 Ã  23h52. Le plan des 14 Ã©tapes est reÃ§u et versÃ© au dÃ©pÃ´t |
| 2026-09-28 | `createAssignment` : `.select()` retirÃ©, cohÃ©rent avec `createMission` |
| 2026-09-28 | ContrÃ´les **20** (droits d'Ã©criture sur les affectations) et **21** (visibilitÃ© des prestataires) ajoutÃ©s |
| 2026-09-28 | **ContrÃ´les 20 et 21 exÃ©cutÃ©s : 21 sur 21 au vert.** Le parcours d'affectation a dÃ©sormais toutes ses fondations mesurÃ©es. **Aucun sixiÃ¨me dÃ©faut trouvÃ©.** |
| 2026-09-28 | `RAPPORT_PROJET.md` **rÃ©Ã©crit intÃ©gralement** : contradictions internes supprimÃ©es, sections alignÃ©es sur le plan, inventaire mesurÃ© |
| 2026-09-28 | **Ã‰TAPE 6 (suite) â€” rÃ©servation codÃ©e** : bouton Â« Publier Â», `useAssignments`, `listerAffectationsMission` (sans imbrication), Ã©cran `(client)/prestation/[id]`. `typecheck`, `lint`, `eslint` et `expo export` verts. **Non testÃ©e Ã  l'Ã©cran** |
| 2026-09-28 | Deux dÃ©cisions de prudence levÃ©es : `CartePrestataire` devient actionnable, et son commentaire Â« AUCUNE ACTION ICI Â» â€” devenu faux â€” est remplacÃ© |
| 2026-09-28 | **TEST FONCTIONNEL RÃ‰USSI.** Parcours complet client : publier â†’ rÃ©server. 2 affectations `pending` crÃ©Ã©es sur des missions `published`. `publish_mission` et `createAssignment` passent pour la premiÃ¨re fois |
| 2026-09-28 | `23505` traduit dans `errors.ts` et doublon bloquÃ© avant le clic : un index unique interdit la double rÃ©servation, et rien ne le disait Ã  l'Ã©cran |
| 2026-09-28 | **DÃ‰FAUT 6 trouvÃ©** : `company_profiles` fermÃ©e aux clients. **La recherche n'a jamais affichÃ© une sociÃ©tÃ©**, et le test du 27/09 l'a manquÃ© parce qu'il cherchait un agent. Migration `20260928002100` Ã©crite : ouvre les sociÃ©tÃ©s ET ajoute `prestataires_par_ids`. ContrÃ´le 22 ajoutÃ© |
| 2026-09-28 | **Ã‰tape 7 + dernier jalon de l'Ã©tape 6 codÃ©s** : Ã©cran agent (voir / accepter / refuser), Ã©cran de suivi client, `CarteAffectation` partagÃ©, `Card` rendu actionnable. `typecheck`, `eslint` et `expo export` verts. **Non testÃ©s Ã  l'Ã©cran** |
| 2026-09-28 | **DÃ‰FAUT 10 trouvÃ© â€” dans le DIAGNOSTIC, pas dans l'application** : `pointer_depart` a deux paramÃ¨tres (`target_assignment_id` **et** `p_rapport`) ; le script de contrÃ´le n'en envoyait qu'un. PostgREST rÃ©sout par signature, donc `PGRST202 fonction introuvable` â€” et le script concluait Â« pas installÃ©e Â», sur une fonction parfaitement installÃ©e et correctement cÃ¢blÃ©e. Le contrÃ´le 25 ne le voyait pas non plus : il ne teste que `proname`. **Le corps d'appel n'est pas un dÃ©tail, c'est un premier argument** |
| 2026-09-28 | **DÃ‰FAUT 9 trouvÃ©** : le client clÃ´turait la mission, l'affectation restait `accepted` â€” Â« TerminÃ©e Â» d'un cÃ´tÃ©, Â« AcceptÃ©e Â» de l'autre, dans le mÃªme Ã©cran. Cause : `transition_mission` n'Ã©coute que le client, `transition_assignment` que l'agent affectÃ©, et **aucun geste unique ne faisait avancer les deux**. `complete_assignment` n'a jamais Ã©tÃ© appelÃ©e, comme `complete_mission` avant elle. Migration `20260928002400` : `cloturer_mission` fait les deux transitions ensemble, et **refuse tant qu'un prestataire n'a pas pointÃ© son dÃ©part**. ContrÃ´le **26** ajoutÃ© |
| 2026-09-28 | **DÃ‰FAUT 8 trouvÃ©** : les fonctions de pointage dÃ©clarÃ©es `STABLE` â€” donc annoncÃ©es comme sans effet de bord. Le `SELECT ... FOR UPDATE` de la fonction interne Ã©chouait par Â« read-only transaction Â», remontÃ© en HTTP 405, un statut qui Ã©voque le rÃ©seau. Migration `20260928002300`. **ContrÃ´le 25 durci : il vÃ©rifie dÃ©sormais la VOLATILITÃ‰, plus seulement l'existence** |
| 2026-09-28 | **DÃ‰FAUT 7 trouvÃ©** : la matrice de `transition_mission` ne comportait **aucune ligne pour `accepted`**. Une mission acceptÃ©e Ã©tait un cul-de-sac : ni annulation, ni litige, ni clÃ´ture. `complete_mission` existait, avait ses droits, et n'a jamais Ã©tÃ© appelÃ©e â€” une fonction inutilisÃ©e est parfaitement conforme. Migration `20260928002200` : matrice rÃ©parÃ©e, `pointer_arrivee` et `pointer_depart` ajoutÃ©es. ContrÃ´le **25** ajoutÃ© |
| 2026-09-28 | **DÃ©cision mÃ©tier : le client clÃ´ture la mission, pas l'agent.** L'arrivÃ©e de l'agent fait passer la mission `accepted` â†’ `in_progress` dans la MÃŠME opÃ©ration ; l'agent termine SA vacation ; le client confirme. Un agent qui pourrait clore pourrait le faire avant l'heure, et le temps facturÃ© s'arrÃªterait |
| 2026-09-28 | `mission/new` dÃ©clarÃ© dans le `_layout` client avec `href: null` : il apparaissait comme un onglet fantÃ´me depuis l'origine |
| 2026-09-28 | **Check-in / check-out et rapport** codÃ©s. `.select()` retirÃ© de `checkIn` et `checkOut` â€” troisiÃ¨me occurrence du motif de P1, attrapÃ© avant cÃ¢blage. ContrÃ´le **23** ajoutÃ© : les droits d'UPDATE des 7 colonnes de pointage n'Ã©taient mesurÃ©s par rien, alors que le contrÃ´le 20 mesurait ceux de l'INSERT |
| 2026-09-28 | **Migration `20260928002100` APPLIQUÃ‰E.** ContrÃ´le 22 au vert : sociÃ©tÃ©s lisibles, `FORCE` actif sur les 2 tables, fonction publique prÃ©sente. ContrÃ´le 4 toujours Ã  37 â€” la politique a **remplacÃ©** l'ancienne. **22 contrÃ´les sur 22** |
| 2026-09-29 | **DÃ‰FAUT 11 trouvÃ© EN VÃ‰RIFIANT** : `dist-web/` est gitignorÃ© mais n'Ã©tait pas dans les `ignores` d'`eslint.config.js`. Le premier `expo export` suffisait donc Ã  faire Ã©chouer `npx eslint .` avec **5 356 erreurs** sur le bundle minifiÃ© (`__r is not defined`), code source sain. Signal vert/rouge devenu illisible, et piÃ¨ge pour la vÃ©rification suivante. CorrigÃ©, puis `npx eslint .` = **exit 0 avec `dist-web/` prÃ©sent** |
| 2026-09-29 | **Ã‰CRAN D'EXÃ‰CUTION DE MISSION RECONSTRUIT.** `src/app/(agent)/mission/[id].tsx` Ã©tait restÃ© Ã  moitiÃ© Ã©crit â€” JSX non fermÃ©, `tsc` et `eslint` en Ã©chec. TerminÃ© : poste actif navy avec chrono **figÃ©** au dÃ©part, statut de la mission, consignes du site, rapport Ã©ditable, pointages d'arrivÃ©e et de dÃ©part dans l'ordre oÃ¹ la base les autorise. `description` et `special_requirements` ajoutÃ©s Ã  la sÃ©lection de `getAgentMissions` â€” **aucune migration n'Ã©tait nÃ©cessaire**, `can_view_mission` ouvre dÃ©jÃ  la ligne Ã  l'agent affectÃ©. `enregistrerRapport` : premiÃ¨re Ã©criture directe d'un Ã©cran, limitÃ©e Ã  `report`, dont le **contrÃ´le 23 mesure dÃ©jÃ  le droit**. Route dÃ©clarÃ©e `href: null` (pas d'onglet fantÃ´me) et atteignable depuis l'accueil et la liste. `tsc` vide, `eslint .` vide, `check:supabase` conforme, `expo export` produit `/(agent)/mission/[id]` (25 Ko). **Aucun rendu Ã  l'Ã©cran** |
| 2026-09-29 | **Lot 1 â€” Â« SecuGuard Enterprise Â» livrÃ©.** Audit des 11 maquettes, puis rÃ©Ã©criture du design system : marque **noir `#000000`** au lieu du teal `#00677F`, fond `#FCF8FA`, navy `#131B2E`, ambre `#F59E0B` / `#FCDEB5`. **La paire de polices est inversÃ©e** : Hanken Grotesk passe en titres (600/700), Plus Jakarta Sans en texte courant (400/500), Manrope dÃ©sinstallÃ©. Splash : fond bleu `#208AEF` â†’ navy `#131B2E` et **image de logo retirÃ©e** â€” le logo reste Ã  produire. `name`/`slug`/`scheme` passÃ©s Ã  `secuguard`, `userInterfaceStyle` forcÃ© Ã  `light`, fond de l'icÃ´ne adaptative passÃ© au navy. Tokens, 6 primitives, `AppHeader`, `tabBarOptions` et Ã©cran d'accueil client rÃ©Ã©crits. **Aucun des 11 Ã©crans maquettÃ©s n'est reconstruit** |
| 2026-09-29 | **Ã‰cran d'exÃ©cution : trois blocs ajoutÃ©s** â€” durÃ©e prÃ©vue dans la pastille du chrono (`end_time - start_time`, Â« Â· dÃ©passÃ©e Â» Ã©crit en toutes lettres, retard mesurÃ© depuis l'arrivÃ©e rÃ©elle), Â« Journal de vacation Â» (`created_at`, `check_in_time`, `check_out_time` ; `updated_at` Ã©cartÃ© car il bouge Ã  chaque Ã©criture), Â« Consignes du client Â» remontÃ©es en tÃªte. Sept blocs de la maquette restent sans source et **ne sont pas simulÃ©s** : NFC, rondes, PTI, batterie, MCE, camÃ©ra, code portail en colonne. `expo-battery` et `mission_events` refusÃ©s, la seconde relevant de l'Ã©tape 11. `tsc`, `eslint .`, `check:supabase`, `expo export` verts. **Aucun rendu Ã  l'Ã©cran** |
| 2026-09-29 | **`test:parcours` : tentative de lancement, bloquÃ©e.** `.env.test` existe et est ignorÃ© par git, mais seul `TEST_AGENT_EMAIL` est renseignÃ© ; les deux mots de passe et l'email client sont vides. Commande **non exÃ©cutÃ©e**, aucun identifiant inventÃ©. Le test ne couvre de toute faÃ§on pas `enregistrerRapport`. Rapport mis Ã  jour : statut Â« amorcÃ©e, bloquÃ©e Â», Ã©tat de `.env.test`, pÃ©rimÃ¨tre du test. **Aucune vÃ©rification nouvelle** |
| 2026-09-29 | **Audit de reprise, Ã  partir du cadrage Â« dÃ©veloppeur senior Â» â€” aucun code Ã©crit.** MesurÃ© : Node 24.15.0, Expo 57.0.27, `tsc` exit 0, `npx eslint .` exit 0, `check:supabase` conforme, `.env` avec les 2 variables Supabase renseignÃ©es. **Risque relevÃ© : 105 entrÃ©es non commitÃ©es (56 fichiers modifiÃ©s ou supprimÃ©s, 49 non suivis), +4 344 / âˆ’1 181 lignes.** Le dernier commit date du 2026-09-28 : tout le design system, l'accueil agent, l'Ã©cran d'exÃ©cution de mission et les services sociÃ©tÃ© / documents / administration n'existent que dans le rÃ©pertoire de travail. Aucune sauvegarde git. **Ã‰cart avec l'architecture cible :** `features/chat`, `payments`, `notifications`, `reviews` sont des dossiers vides ; `expo-notifications`, Stripe, cartographie et `expo-location` ne sont pas installÃ©s (cohÃ©rent avec les Ã©tapes 10 et 11 non commencÃ©es) |
| 2026-09-30 | **DÃ‰FAUT 12 â€” quatre fichiers pour une seule URL.** ConstatÃ© par le commanditaire sur `localhost:8081/profile`. Un groupe entre parenthÃ¨ses n'entre pas dans l'URL : `(client)/profile`, `(agent)/profile`, `(company)/profile` et `(admin)/profile` produisaient **tous** `/profile`. Idem `/missions` (Ã—4) et `/mission/[id]` (Ã—2) â€” **onze URL publiques pour huit Ã©crans**. Le routeur Ã©lisait un vainqueur arbitraire et `ProtectedRoute` redirigeait vers `role-selection` si le rÃ´le ne correspondait pas. La navigation interne n'Ã©tait pas cassÃ©e : les 12 `router.push` portaient le groupe. **Aucun des trois contrÃ´les obligatoires ne l'aurait vu** â€” `typedRoutes` valide la forme d'une chaÃ®ne, pas son unicitÃ©. CorrigÃ© par suffixes d'espace (`profil-client`, `missions-agent`, `mission-suivi/[id]`, `mission-execution/[id]`) : 24 occurrences dans 9 fichiers, 10 `Tabs.Screen` dans 4 layouts, renommages par `git mv`. VÃ©rifiÃ© : `tsc` vide, `eslint .` exit 0, `check:supabase` conforme, **table de routes rÃ©gÃ©nÃ©rÃ©e = 22 URL publiques, 0 doublon** |
| 2026-09-30 | **LE CACHE METRO A MENTI, ET IL L'AVAIT DÃ‰JÃ€ FAIT.** Le premier relevÃ© de la table de routes, aprÃ¨s les renommages, affichait *encore* `/profile` et `/missions` **en plus** des nouveaux noms. Fichier datÃ© d'avant les modifications : `.expo/types/router.d.ts` ne se rÃ©gÃ©nÃ¨re qu'au **dÃ©marrage** du serveur de dev, et le supprimer ne suffit pas. AprÃ¨s redÃ©marrage, le fichier est passÃ© de 16 009 Ã  12 069 octets. Sans ce contrÃ´le, la correction aurait Ã©tÃ© dÃ©clarÃ©e non faite |
| 2026-09-30 | **`expo export` manquait, et il l'a dÃ©jÃ  rattrapÃ© une fois.** Le renommage du 30 a Ã©tÃ© publiÃ© sur la foi de `tsc` + `eslint` + table de types â€” **aucun ne construit le bundle**. L'export a ensuite rÃ©ussi sur les 4 Ã©crans du lot suivant. RÃ¨gle appliquÃ©e dÃ©sormais : `npx expo export` **puis** `npx eslint .`, dans cet ordre |
| 2026-09-30 | **Ã‰cran 404 crÃ©Ã©.** `src/app/+not-found.tsx` â€” il n'en existait **aucun** : toute URL erronÃ©e affichait un Ã©cran vide, sans explication. ConsÃ©quence directe du dÃ©faut 12. L'Ã©cran **constate** sans **supposer** : il n'affirme pas que la page n'existe pas (l'URL peut Ãªtre valide et le code cassÃ©), il affiche l'adresse fautive telle que reÃ§ue et propose l'accueil du bon rÃ´le via `getRoleHomeRoute` â€” un `/(client)` fixe aurait renvoyÃ© un prestataire vers une garde qui le refuse, donc en boucle. VÃ©rifiÃ© : `dist/+not-found.html` gÃ©nÃ©rÃ©, texte prÃ©sent. **Non rouvert Ã  l'Ã©cran** |
| 2026-09-30 | **Ã‰valuation mesurÃ©e, et trois affirmations du rapport fausses.** Â« Espaces sociÃ©tÃ© / admin : Ã©crans vides, aucune requÃªte de donnÃ©e Â» Ã©tait **faux** : 13 Ã©crans sur 27 importaient `features`/`services`/`hooks`, et `(company)/index.tsx` en lisait 4. Les compteurs de dossiers Ã©taient pÃ©rimÃ©s eux aussi â€” `src/app` 31 â†’ 35, `components` 25 â†’ 32, `features` 12 â†’ 23, `services` 5 â†’ 9, total **91 â†’ 117 fichiers**. CorrigÃ© au mesurÃ©. Un rapport qui sous-estime son propre projet fait retravailler ce qui existe |
| 2026-09-30 | **Les 4 Ã©crans vides branchÃ©s aux services existants.** `(company)/team` â†’ `getMyTeam`, `(company)/missions-societe` â†’ `getCompanyMissions`, `(admin)/users` â†’ `getDossiersEnAttente`, `(admin)/missions-admin` â†’ **nouveau** `useMissionsAdmin`. **Aucune migration nÃ©cessaire** : `can_view_mission` commence par `private.is_admin()` (`20260925000200_rls_helpers.sql:35`), donc l'administrateur ouvrait dÃ©jÃ  toutes les lignes â€” ce qui manquait Ã©tait l'Ã©cran, pas le droit. **17 Ã©crans sur 27** lisent dÃ©sormais la base, et **aucun service Ã©crit n'est orphelin**. Trois boutons supprimÃ©s parce qu'ils promettaient des fonctions inexistantes : Â« Inviter un agent Â», Â« Rechercher des missions Â», validation admin. Les Ã©tats chargement / erreur / vide sont distincts, et l'erreur affichÃ©e est traduite par `toUserFacingError` |
| 2026-09-30 | **Une MÃŠME FAMILLE DE FAUX COMPTEURS, TROIS Ã‰CRANS DE PLUS.** L'accueil admin affichait `value="0"` **en dur** pour deux tuiles, et deux boutons `onPress={() => {}}`. `getStatistiques` comptait dÃ©jÃ  missions, agents, sociÃ©tÃ©s et clients : le chiffre existait, il n'Ã©tait pas appelÃ©. Â« 0 Â» en dur disait la mÃªme chose pour une plateforme vide et pour une plateforme pleine. Les deux profils sociÃ©tÃ© et admin lisaient `profile.role` au lieu de `roles[0]`, donc afficher le rÃ´le par dÃ©faut de l'inscription, pas les rÃ´les rÃ©ellement portÃ©s. Le profil sociÃ©tÃ© n'affichait **aucune** fiche sociÃ©tÃ©, alors que `useMaFicheSociete` existait. CorrigÃ©s : compteurs rÃ©els en `StatTile` (icÃ´nes Material, tokens centralisÃ©s â€” `StatCard` prend un emoji et porte des couleurs en dur, ce qu'interdit `AGENTS.md`), tous les rÃ´les listÃ©s, fiche sociÃ©tÃ© affichÃ©e en lecture seule. `StatCard` n'est plus utilisÃ© dans aucun Ã©cran : **0 bouton sans effet, 0 emoji, 0 lecture de `profile.role` dans le code** |
| 2026-09-30 | **Deux boutons devenus des navigations, et un libellÃ© rectifiÃ©.** Â« Superviser les missions Â» mÃ¨ne Ã  `/(admin)/missions-admin` et Â« Valider les utilisateurs Â» Ã  `/(admin)/users` â€” mais `users` **liste** la file sans la vider, aucune des 11 RPC ne changeant un statut de prestataire. Le libellÃ© est donc Â« Voir la file de validation Â», ce qui est exactement ce que fait la destination. Un bouton qui promet une dÃ©cision et ouvre une liste est un mensonge d'interface |
| 2026-09-30 | **Limite assumÃ©e de ce lot.** Les Ã©crans de validation et d'annulation **n'ont pas** Ã©tÃ© ajoutÃ©s : ils exigent de nouvelles fonctions serveur, donc une migration â€” dÃ©cision qui revient au commanditaire. Aucun des 8 Ã©crans de ces deux espaces n'a Ã©tÃ© rouvert Ã  l'Ã©cran |
| 2026-09-30 | **`npm run check:routes` â€” quatriÃ¨me contrÃ´le, contre le dÃ©faut 12.** Aucun des trois contrÃ´les obligatoires ne pouvait voir deux Ã©crans sur la mÃªme URL : `typedRoutes` valide la **forme** d'une chaÃ®ne, pas son **unicitÃ©**. Le script dÃ©rive les URL de `src/app` et Ã©choue si deux fichiers les publient. Il exclut volontairement la racine `/` â€” les cinq `index` de groupe sont le motif normal d'Expo Router, et les compter comme conflit pousserait Ã  un correctif qui casserait les accueils. **Il s'auto-teste sur 8 cas tÃ©moins avant tout rapport** |
| 2026-09-30 | **LE CONTRÃ”LE A PUBLIÃ‰ TROIS FAUX RÃ‰SULTATS, ET C'EST CONSIGNÃ‰.** Premier essai : le filtre des segments supprimait le nom du fichier au lieu de son extension â€” 27 Ã©crans projetÃ©s sur `/`, soit 1 conflit sur une route inexistante. Second essai : la racine `/` comptÃ©e comme conflit â€” le script poussait Ã  renommer les `index` de groupe, ce qui aurait produit `/index-client` au lieu de l'accueil de l'espace. TroisiÃ¨me essai, le seul retenu : **le tÃ©moin de test lui-mÃªme Ã©tait mal construit** â€” un fichier nommÃ© diffÃ©remment ne peut pas crÃ©er de doublon, et le script a affichÃ© Â« conforme Â» avec un vrai conflit en place. Il a fallu recrÃ©er le doublon **exact** (mÃªme nom de fichier, deux groupes) pour obtenir `exit 1` et les deux fichiers nommÃ©s. Sans ces trois Ã©checs, le contrÃ´le aurait Ã©tÃ© vert et faux â€” c'est-Ã -dire pire qu'absent |



---

## MÃ©thode de vÃ©rification

Aucune Ã©tape n'est dÃ©clarÃ©e terminÃ©e sans exÃ©cution. Les quatre commandes Ã 
lancer avant de dire Â« c'est fini Â» :

```bash
npm run typecheck      # doit Ãªtre vide
npm run lint           # doit Ãªtre vide
npx eslint .           # tout le dÃ©pÃ´t, scripts/ inclus
npm run check:supabase # doit dire Â« RESULTAT : conforme Â»
```

Et, pour la base, `supabase/verification/VERIFICATION_RAPIDE.sql` dans le SQL
Editor : **26 lignes, 0 `ALERTE`** (le compte a Ã©voluÃ© de 21 Ã  26 le 2026-09-28).

> Un vert sur `check:supabase` ne vaut pas validation fonctionnelle. Le script
> teste le rÃ´le `anon` et ne dit **rien** de ce qu'un utilisateur connectÃ© voit.
> Seul un test Ã  l'Ã©cran, avec un vrai compte, prouve qu'un parcours marche.

> `npx expo export` **puis** `npx eslint .` : cet ordre est dÃ©sormais sans
> risque, `dist-web/**` Ã©tant ignorÃ©. Avant le correctif du 2026-09-29, le
> second Ã©chouait dÃ¨s que le premier avait rÃ©ussi.
