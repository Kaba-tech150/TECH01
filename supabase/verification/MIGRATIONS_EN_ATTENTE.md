# MIGRATIONS EN ATTENTE — SECU GUARD

> **Ce document remplace l'ordre décrit dans `RECONSTRUCTION_BASE.md` et
> `GUIDE_APPLICATION_MIGRATIONS.md`.** Ces deux fichiers décrivent un état
> antérieur au 2026-09-27 : ils ne connaissent ni la table `villes`, ni les
> migrations `01200` à `01500`. Les suivre conduit à réappliquer les migrations
> dans le désordre — c'est exactement ce qui a produit les défauts actuels.
>
> **Durée : environ 4 minutes. Une seule fois.**

---

## OÙ EN SOMMES-NOUS

La base est saine. `VERIFICATION_RAPIDE.sql` ne signale qu'un seul défaut
réel, et il est connu.

| Contrôle | Attendu | Obtenu | Verdict |
|---|---|---|---|
| 1 à 3, 5 à 11, 13 à 17 | — | — | ✅ **OK** |
| **4 — Politiques RLS** | **38** | **37** | 🔴 **écart de 1** |
| **12 — Politique insert affectations** | **1** | **0** | 🔴 **ALERTE** |

**Les contrôles 4 et 12 désignent le même défaut unique** : il manque la
politique d'insertion sur `mission_assignments`. Tout le reste est conforme.

> Le contrôle 4 affichait « OK » jusqu'au 2026-09-27 parce que son seuil portait
> sur `>= 33`, trop lax pour voir l'écart. Il a été relevé à 38 : vous voyez
> maintenant l'écart au lieu d'un vert trompeur.

---

## LA SEULE OPÉRATION À FAIRE

### Fichier : `supabase\migrations\20260926001200_restore_assignment_insert.sql`

C'est la migration `00600` rejouée proprement. Elle recrée la politique
d'insertion sur `mission_assignments`, et les droits associés.

**Pourquoi elle manque.** Le fichier `000001_reset_all.sql` a été exécuté
**après** `00600`. Son `DROP TABLE ... CASCADE` a supprimé la politique **et**
les droits au niveau table — mais **pas** la fonction
`private.can_assign_mission` du même fichier, car le corps d'une fonction SQL
n'est pas une dépendance suivie par PostgreSQL. C'est pourquoi la moitié
survivante de `00600` passait les contrôles, et l'autre moitié non.

**Conséquence concrète :** `missionsService.createAssignment()` est
structurellement inutilisable. Le parcours d'affectation d'un agent ou d'une
société à une mission est mort.

---

## COMMENT FAIRE

1. Ouvrez `https://supabase.com/dashboard`
2. Projet **SECU GUARD** (référence `awexvvfhfzqovsvtwjfr`)
3. Menu gauche → **SQL Editor** (icône `</>`)
4. Bouton **+ New query**
5. Dans VS Code : `supabase\migrations\20260926001200_restore_assignment_insert.sql`
   → ouvrir → `Ctrl + A` → `Ctrl + C`
6. Dans la zone blanche du SQL Editor → `Ctrl + V`
7. Bouton **Run**

✅ **Attendu :** message vert **« Success. No rows returned »**

> ⚠️ L'avertissement « opérations destructrices » est normal pour ce projet.
> Ce fichier fait un `DROP POLICY`, pas un `DROP TABLE`. **Aucune donnée
> n'est touchée.**

❌ **Si vous voyez une erreur rouge :** arrêtez-vous et copiez-moi le message
**en entier**. Ce fichier s'auto-vérifie : il échoue volontairement si son effet
est incomplet, plutôt que de laisser passer un demi-correctif.

---

## ⚠️ NE REJOUEZ JAMAIS `000001_reset_all.sql`

Ce fichier détruit les 13 tables. Il est rangé **avant** la chaîne de
migrations, donc il s'exécute en premier par ordre alphabétique — c'est
**heureux**, pas par intention.

C'est précisément son exécution **après** `00600` qui a créé le défaut que vous
corrigez maintenant. Tout fichier destructeur passe **AVANT** les migrations,
jamais après.

---

## VÉRIFIER (30 secondes)

Rejouez `supabase\verification\VERIFICATION_RAPIDE.sql` — un seul clic, il
vient d'être mis à jour (contrôles 17, 18 et 19 ajoutés).

**Les deux lignes à regarder :**

| Contrôle | Avant | Après |
|---|---|---|
| 4 — Politiques RLS | 37 → ALERTE | **38 → OK** |
| 12 — Politique insert affectations | 0 → ALERTE | **1 → OK** |

Si l'une reste en ALERTE, la migration n'a pas été appliquée en entier.

Puis, dans le terminal VS Code :

```
npm run check:supabase
```

✅ **Attendu :** `RESULTAT : conforme.`

---

## ET ENSUITE — LE TEST QUI PROUVE TOUT

C'est la seule chose qui manquait. Elle n'est pas faisable par SQL : elle
demande un vrai utilisateur authentifié.

1. Terminal VS Code : `npm run web`
2. Dans le navigateur : créez un compte avec une **adresse email neuve**
3. Confirmez l'email reçu
4. Connectez-vous
5. Espace client → **« Créer une mission »**
6. Remplissez : titre, adresse, ville, date de début, date de fin

### Ce que vous devez voir

✅ **La mission apparaît dans la liste**, statut `Brouillon`.

C'est le premier flux métier fonctionnel de l'histoire du projet.

### Si ça échoue encore

L'erreur affichée sera **en français et sans détail technique** — c'est
volontaire : un message PostgreSQL brut révélerait l'existence de tables, de
politiques et de rôles.

Regardez la **console du navigateur (F12)** : la ligne `[SecuGuard]` y indique
la cause technique exacte. Collez-la-moi telle quelle.

---

## AVERTISSEMENT

`npm run check:supabase` prouve que la base **est en place et protégée en
lecture**. Il ne prouve **pas** que l'écriture fonctionne : c'est exactement
pourquoi le test d'inscription existe. Un vert sur ce script ne vaut pas
validation fonctionnelle.

---

**En cas de blocage :** copiez-moi le nom du fichier, le message d'erreur en
entier, et la ligne mentionnée.