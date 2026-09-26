# GUIDE D'APPLICATION DES MIGRATIONS — SECU GUARD

> **Ce document s'adresse à vous, pas à un développeur.**
> Il ne suppose aucune compétence SQL. Chaque étape indique **où cliquer**, **quoi coller**
> et **ce que vous devez voir** pour savoir que ça a fonctionné.
>
> Durée totale : environ 15 minutes. Une seule fois.

---

## AVANT DE COMMENCER

### Ce dont vous avez besoin

- Votre compte Supabase (celui du projet existant)
- Aucune clé secrète à chercher : le projet s'appelle `awexvvfhfzqovsvtwjfr`

> 💡 **À propos des blocs encadrés dans ce document :** certains passages sont entourés
> de trois accents graves (```). **Ce sont des signes de mise en forme, pas du SQL.**
> Ne les copiez jamais dans le SQL Editor. Le seul endroit où vous devez recopier du texte
> depuis ce document est la commande `npm run check:supabase` (étape 10), qui va dans le
> terminal VS Code, et les noms de fichiers, que vous ouvrez plutôt que de les copier.
> Pour le SQL lui-même, vous ouvrez toujours un fichier `.sql` avec VS Code.

### Où sont les fichiers

Sur votre ordinateur, dans ce dossier :

```
C:\Users\ImpulsionClub\Desktop\secu\supabase\migrations\
C:\Users\ImpulsionClub\Desktop\secu\supabase\verification\
```

### Comment copier un fichier

Dans VS Code : **clic droit sur le fichier → Ouvrir**, puis `Ctrl + A` (tout sélectionner),
puis `Ctrl + C` (copier).

---

## PARTIE 1 — OUVRIR LE SQL EDITOR

1. Ouvrez votre navigateur et allez sur **https://supabase.com/dashboard**
2. Connectez-vous si nécessaire.
3. Cliquez sur le projet **SECU GUARD** (référence `awexvvfhfzqovsvtwjfr`).
4. Dans le menu de gauche, cliquez sur **SQL Editor** (icône `</>`).
5. Cliquez sur **+ New query**.
6. Vous obtenez une grande zone blanche avec un bouton **Run** en haut.

**Vous êtes prêt.** Ne fermez pas cette page.

---

## PARTIE 2 — COLLER LES MIGRATIONS

> ⚠️ **ORDRE REMIS À JOUR LE 2026-09-26.**
>
> Ce document décrit la procédure initiale. Les tables `profiles` et `missions`
> ont depuis été supprimées volontairement et ont été recréées : **la migration
> `00100` doit être relancée**, et une migration de restauration des clés
> étrangères (`01000`) a été ajoutée.
>
> 👉 **Suivez `supabase/verification/RECONSTRUCTION_BASE.md`**, qui donne l'ordre
> actuel. Ce document est conservé comme référence historique.

> ⚠️ **L'ordre compte.** Ne le changez pas, chaque migration dépend de la précédente.
> ⚠️ **Collez le fichier EN ENTIER**, du début à la fin.
> ✅ **BONNE NOUVELLE :** `20260925000100` est **déjà appliquée** (les 12 tables
> existent). Il reste **7 fichiers** à coller. Trois correctifs ont été ajoutés
> les 2026-09-26 (étapes 1, 6 et 7).

### ÉTAPE 1/11 — `20260925000900_schema_convergence.sql` (182 lignes)

Fichier : `supabase\migrations\20260925000900_schema_convergence.sql`

1. Ouvrez le fichier dans VS Code → `Ctrl + A` → `Ctrl + C`
2. Dans le SQL Editor, cliquez dans la zone de texte → `Ctrl + V`
3. Cliquez sur **Run**

✅ Attendu : message vert **« Success. No rows returned »**

> ⚠️ **CETTE ÉTAPE VIENT EN PREMIER, ET ELLE EST PLUS IMPORTANTE QUE VOUS NE
> LE PENSEZ.**
>
> **Ce qui s'est passé :** deux erreurs de type `42703` sont apparues
> successivement — `la colonne "phone" de la relation "profiles" n'existe pas`,
> puis `la colonne "postal_code" de la relation "missions" n'existe pas`.
> Elles ont **la même cause**.
>
> Les tables `profiles` et `missions` existaient **déjà** sur votre base avant
> la migration `00100`, avec une structure plus ancienne. Or `00100` utilise
> `create table if not exists`, qui **ne fait rien** si la table existe déjà :
> les colonnes ajoutées depuis n'ont donc jamais été créées.
>
> Corriger ces colonnes une par une aurait produit une nouvelle erreur à
> chaque essai. Ce fichier aligne **les 12 tables** sur le schéma de référence
> en une seule passe : **75 colonnes** vérifiées une à une.
>
> Chaque ligne est un `add column if not exists` : sur une colonne déjà
> présente, l'instruction ne fait rien. Aucune donnée n'est supprimée, aucun
> type n'est modifié. Vous pouvez rejouer ce fichier sans risque.

---

### ÉTAPE 2/11 — `20260925000200_rls_helpers.sql` (137 lignes)

Fichier : `supabase\migrations\20260925000200_rls_helpers.sql`

1. Ouvrez le fichier dans VS Code → `Ctrl + A` → `Ctrl + C`
2. Dans le SQL Editor, cliquez dans la zone de texte → `Ctrl + V`
3. Cliquez sur **Run**

✅ Attendu : message vert **« Success. No rows returned »**
❌ Si vous voyez une erreur rouge : **arrêtez-vous** et copiez-moi le message complet.

---

### ÉTAPE 3/11 — `20260925000300_rls_policies.sql` (270 lignes)

Fichier : `supabase\migrations\20260925000300_rls_policies.sql`

Même procédure.

✅ Attendu : **« Success. No rows returned »**

> C'est le fichier le plus important : il active la sécurité sur les 12 tables
> (32 politiques d'accès, 18 droits accordés).
>
> **C'est ce fichier qui débloque votre erreur « permission denied for schema
> public ».** Il contient le `grant usage on schema public` qui manque
> aujourd'hui à votre base.

---

### ÉTAPE 4/11 — `20260925000400_state_transitions.sql` (235 lignes)

Fichier : `supabase\migrations\20260925000400_state_transitions.sql`

Même procédure.

✅ Attendu : **« Success. No rows returned »**

> Ce fichier crée 8 fonctions serveur qui contrôlent les changements de statut.
> C'est ce qui empêche un client de marquer une mission « terminée » sans respecter les règles.

---

### ÉTAPE 5/11 — `20260925000500_rls_transitions_fix.sql` (45 lignes)

Fichier : `supabase\migrations\20260925000500_rls_transitions_fix.sql`

Même procédure.

✅ Attendu : **« Success. No rows returned »**

> ⚠️ **NE SAUTEZ PAS CETTE ÉTAPE.** Elle corrige un conflit entre l'étape 3 (RLS)
> et l'étape 4 (transitions). Sans elle, les changements de statut ne marcheront pas.

---

### ÉTAPE 6/11 — `20260925000600_assignment_insert_fix.sql` (114 lignes)

Fichier : `supabase\migrations\20260925000600_assignment_insert_fix.sql`

Même procédure.

✅ Attendu : **« Success. No rows returned »**

> ⚠️ **OBLIGATOIRE.** Ajoutée le 2026-09-26. Sans elle, il est impossible
> d'affecter un agent ou une société à une mission : il manquait à la fois la
> politique RLS d'insertion et le droit d'écriture.

---

### ÉTAPE 7/11 — `20260925000700_signup_triggers_fix.sql` (88 lignes)

Fichier : `supabase\migrations\20260925000700_signup_triggers_fix.sql`

Même procédure.

✅ Attendu : **« Success. No rows returned »**

> ⚠️ **OBLIGATOIRE. C'est le fichier le plus urgent pour vous.** Ajoutée le
> 2026-09-26 après la découverte que **l'inscription était cassée**.
>
> Quand un utilisateur s'inscrit, deux triggers doivent créer son profil, son
> rôle et son portefeuille. Ils sont en `SECURITY DEFINER` et l'étape 3 a
> activé `force row level security`, qui les soumet aux politiques RLS. Résultat :
> **l'inscription échoue en entier** et l'utilisateur reste bloqué sur
> « Accès indisponible ».
>
> Ce fichier retire ce `FORCE` sur `profiles` et `wallets` uniquement. La
> sécurité côté client est inchangée.

---

## PARTIE 3 — RAFRAÎCHIR LA BASE

### ÉTAPE 8/11 — Rafraîchir le cache

Dans le SQL Editor, faites `Ctrl + A` pour tout effacer, puis **tapez vous-même** cette
ligne dans la zone de texte (ne la copiez pas depuis ce document) :

    NOTIFY pgrst, 'reload schema';

Puis cliquez sur **Run**.

✅ Attendu : **« Success. No rows returned »**

> ⚠️ **Si vous voyez l'erreur `syntax error at or near "```"`, c'est que les trois
> petits accents graves ```` ``` ```` ont été collés avec la commande.** Ce sont des
> signes de mise en forme de ce document, pas du SQL. Effacez tout (`Ctrl + A`) et
> retapez la ligne à la main, en recopiant uniquement ce qui est écrit ci-dessus.
>
> **Pourquoi cette étape :** la base garde en mémoire la liste de ses tables. Après en
> avoir ajouté 10 nouvelles, elle doit le savoir. Cette ligne lui ordonne de se mettre à jour.

---

## PARTIE 4 — VÉRIFIER LA BASE

### ÉTAPE 9/11 — Contrôle complet

> 💡 **Vous voulez un seul verdict ?** Utilisez plutôt
> `supabase\verification\VERIFICATION_RAPIDE.sql` : **une seule requête** qui
> regroupe les 13 vérifications essentielles et affiche un tableau
> `OK / ALERTE`. C'est plus rapide et plus lisible que les 19 contrôles
> détaillés ci-dessous, qui restent utiles pour un audit complet.

Fichier : `supabase\verification\VERIFICATION_POST_MIGRATION.sql` (549 lignes)

1. Ouvrez le fichier dans VS Code → `Ctrl + A` → `Ctrl + C`
2. Dans le SQL Editor, effacez tout (`Ctrl + A`) puis collez (`Ctrl + V`)
3. Cliquez sur **Run**

✅ **Ce que vous devez voir :** plusieurs tableaux de résultats. Chaque ligne contient
`OK`, `ALERTE` ou `INFO`.

**Les 6 contrôles vraiment importants :**

| Contrôle | Ce qu'il vérifie | Attendu |
|---|---|---|
| **2** | Tables sans RLS (= fuite de données) | **aucune ligne** |
| **6** | Écriture interdite sur colonnes sensibles | **aucune ligne** |
| **12** | Récapitulatif final | **tout en `OK`** |
| **15** | **Triggers d'inscription présents et actifs** | **2 lignes `OK`** |
| **16** | **Le client ne peut pas forger un profil** | **aucune ligne** |
| **17** | **Toutes les colonnes de `profiles` existent** | **aucune ligne** |
| **19** | **FORCE RLS absent sur les 3 tables d'inscription** | **3 lignes `OK`** |

> ⚠️ **Le contrôle 15 est nouveau et il vous concerne directement.** Il vérifie
> que les deux triggers qui créent votre profil à l'inscription existent
> toujours. Le contrôle 10 ne les voyait pas, car l'un d'eux est posé sur
> `auth.users` et pas sur une table `public` : c'est pour cela que la panne
> était invisible jusqu'ici.
>
> Le contrôle 16 est sa contre-mesure : il vérifie que le client n'a toujours
> pas le droit d'écrire lui-même un profil, ce qui permettrait de s'attribuer le
> rôle `admin`.

**`INFO` n'est pas une erreur.** Par exemple, au contrôle 3, les tables `missions` et
`mission_assignments` affichent `OK (volontairement sans FORCE)` : c'est voulu, c'est la
migration 00500 qui l'a fait exprès.

❌ **Si le contrôle 2 ou le 6 affiche des lignes**, ce sont des failles de sécurité :
copiez-moi la sortie et **n'utilisez pas l'application** en attendant.

> ⚠️ **Si vous voyez une erreur rouge du type `syntax error` ou `column ... does not exist`**
> à la place d'un tableau de résultats : le fichier a été mal collé ou il est périmé.
> Reprenez depuis le début de cette étape. Si l'erreur persiste, dites-le-moi : cela
> signifiera que le fichier doit être corrigé de mon côté.

> 💡 Le SQL Editor peut n'afficher que les derniers résultats. Utilisez les petites flèches
> `‹ ›` sous les résultats, ou le bouton de téléchargement, pour lire les 19 contrôles.
> Chaque contrôle est séparé par un commentaire `-- CONTRÔLE X`.

---

## PARTIE 5 — VÉRIFIER CÔTÉ APPLICATION

### ÉTAPE 10/11 — Test d'accès (dans VS Code)

Cette étape se fait dans **VS Code**, pas sur le site Supabase.

1. Ouvrez VS Code sur le dossier `C:\Users\ImpulsionClub\Desktop\secu`
2. Menu **Terminal → Nouveau terminal** (ou `Ctrl + ù`)
3. Tapez cette commande et appuyez sur Entrée :

```
npm run check:supabase
```

✅ **Ce que vous devez voir :** 12 lignes, toutes commençant par `OK` :

```
  OK       profiles               acces refuse par la RLS (attendu)
  OK       profile_roles          acces refuse par la RLS (attendu)
  OK       rpc publish_mission    existe et refuse le role anon
  ...
RESULTAT : conforme.
```

❌ Si des lignes affichent `ALERTE`, reprenez à partir de l'étape 8.

---

### ÉTAPE 11/11 — Test d'inscription (le plus important)

C'est l'étape qui manquait, et c'est celle qui aurait dû être faite avant.

> ⚠️ **Si l'inscription affiche « Erreur d'inscription » ou « La création de
> votre profil a échoué côté serveur », ne réessayez pas :** collez d'abord la
> requête de diagnostic ci-dessous. Elle indique en une ligne ce qui manque.
>
> Dans le SQL Editor, effacez tout (`Ctrl + A`) puis collez et lancez :

    select
      (select count(*) from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles'
          and column_name = 'phone') as colonne_phone,
      (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'profiles'
          and c.relforcerowsecurity) as rls_forcee_sur_profiles,
      (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'publish_mission') as fonctions_transition,
      (select count(*) from pg_trigger tg
        where tg.tgname = 'on_auth_user_created_secuguard' and tg.tgenabled = 'O')
        as trigger_inscription_actif;

> **Lecture du résultat** (les 4 valeurs doivent être `1`, `0`, `1`, `1`) :
>
> | Valeur | Attendu | Si différent |
> |---|---|---|
> | `colonne_phone` | `1` | `0` → la migration **00800** n'a pas été appliquée |
> | `rls_forcee_sur_profiles` | `0` | `1` → la migration **00700** n'a pas été appliquée : c'est la cause de l'échec |
> | `fonctions_transition` | `1` | `0` → la migration **00400** n'a pas été appliquée |
> | `trigger_inscription_actif` | `1` | `0` → le trigger a été supprimé ou désactivé |

1. Relancez l'application : `npx expo start`
2. Inscrivez-vous avec une **adresse email neuve** (jamais utilisée)
3. Vous devez voir l'écran **« Vérifiez votre messagerie »** — c'est normal
4. Cliquez sur le lien de confirmation reçu par email
5. Revenez dans l'application et connectez-vous
6. Vous devez arriver sur votre espace, **sans** message « Accès indisponible »

✅ **Ce que vous devez voir :** votre nom s'affiche sur l'écran d'accueil.

> 💡 Si l'inscription échoue encore, regardez le **terminal Metro** où vous
> lancez `npx expo start` : la ligne `[SecuGuard] inscription — ... technique=...`
> indique la cause réelle, qui n'est volontairement jamais affichée dans
> l'application.
>
> Pour vérifier que la base a bien été alimentée, collez cette requête dans
> le SQL Editor (elle ne lit rien de confidentiel) :

    select p.email, p.role, count(w.id) as wallets
    from public.profiles p
    left join public.wallets w on w.profile_id = p.id
    group by p.email, p.role
    order by p.created_at desc
    limit 5;

> Chaque ligne affichée prouve qu'un profil ET un portefeuille ont été créés
> automatiquement par les triggers. Une ligne où `wallets` vaut `0` signifie
> que le trigger de portefeuille ne s'est pas déclenché.


---

## PARTIE 6 — ME RENVOYER LES RÉSULTATS

Copiez-collez dans notre conversation :

1. La sortie de l'**étape 9**, en particulier les contrôles **2, 6, 12, 15, 16, 17, 19**
2. La sortie de l'**étape 10** (`npm run check:supabase`)
3. Le résultat de l'**étape 11** : avez-vous réussi à vous inscrire et à
   confirmer votre email ? Un simple « oui » ou « non » suffit.

---

## EN CAS DE PROBLÈME

### Si une migration échoue

Ne continuez pas. Copiez-moi :

- le nom du fichier que vous exécutiez
- le message d'erreur **en entier** (il y a souvent une ligne `DETAIL` utile)
- la ligne mentionnée dans l'erreur, si elle existe

Bonne nouvelle : les migrations sont **rejouables**. Elles utilisent `if not exists` et
`create or replace`, donc relancer une migration corrigée ne casse pas la base.

### Si le SQL Editor refuse le fichier

- Vérifiez d'avoir collé **tout** le fichier (`Ctrl+A` puis `Ctrl+V`, pas un copier-coller partiel)
- Les fichiers longs sont acceptés : patientez une seconde après `Ctrl+V`

### Si vous préférez faire plus tard

Aucun souci : les migrations sont écrites et vérifiées, elles ne disparaîtront pas.
Dites-le-moi et on passe à autre chose.

---

## RAPPEL DE L'ORDRE

| # | Fichier | Lignes |
|---|---|---|
| 1 | `20260925000100_initial_schema.sql` | 276 |
| 2 | `20260925000200_rls_helpers.sql` | 137 |
| 3 | `20260925000300_rls_policies.sql` | 270 |
| 4 | `20260925000400_state_transitions.sql` | 235 |
| 5 | `20260925000500_rls_transitions_fix.sql` | 40 ← ne pas sauter |
| 6 | `NOTIFY pgrst, 'reload schema';` | 1 |
| 7 | `VERIFICATION_POST_MIGRATION.sql` | 375 |
| 8 | `npm run check:supabase` | (terminal VS Code) |

