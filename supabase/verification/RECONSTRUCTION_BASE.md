# RECONSTRUCTION DE LA BASE — SECU GUARD

> ## ⛔ DOCUMENT PÉRIMÉ — NE PAS SUIVRE
>
> **La liste des 9 fichiers de ce document date du 2026-09-26 et est
> incomplète.** Elle ne mentionne ni `20260925001100_villes.sql`, ni les
> migrations `01200` à `01500` du 2026-09-27.
>
> ➡️ **Suivez [`MIGRATIONS_EN_ATTENTE.md`](MIGRATIONS_EN_ATTENTE.md)**, qui
> est à jour.
>
> Ce document reste valable comme **procédure générale** (où cliquer, comment
> coller, comment rafraîchir le cache PostgREST), et comme explication de
> pourquoi la table `profiles` devait être recréée.

---

**Ce document remplace l'ordre des étapes précédent. Il est daté du 2026-09-26.**

---

## POURQUOI CE CHANGEMENT

Les tables `public.profiles` et `public.missions` ont été supprimées volontairement
le 2026-09-26, pour repartir d'un schéma propre après que leurs versions
héritées aient bloqué les migrations.

Une conséquence a été sous-estimée : la suppression en cascade a également
supprimé **les clés étrangères** qui pointaient vers ces deux tables. Les 10
tables survivantes ont donc perdu leurs liens d'intégrité, sans la moindre
erreur visible.

**C'est ce que la migration `01000` répare.**

---

## AVANT DE COMMENCER

Dans `https://supabase.com/dashboard` → projet **SECU GUARD** → **SQL Editor** → **+ New query**

Pour chaque étape : ouvrir le fichier dans VS Code → `Ctrl + A` → `Ctrl + C` → coller → **Run**

Dossier : `C:\Users\ImpulsionClub\Desktop\secu\supabase\migrations\`

Attendu à chaque étape : **« Success. No rows returned »**

> L'avertissement « opérations destructrices » est normal. Cliquez sur **Run**.
> Ne copiez jamais les ` ``` ` : ce sont des signes de mise en forme, pas du SQL.

---

## LES 9 FICHIERS, DANS L'ORDRE

| # | Fichier | Lignes | Rôle |
|---|---|---|---|
| **1** | `20260925000100_initial_schema.sql` | 276 | **RECrée `profiles` et `missions`** |
| **2** | `20260925001000_restore_foreign_keys.sql` | 86 | **Restaure les 14 clés étrangères perdues** |
| 3 | `20260925000900_schema_convergence.sql` | 182 | Vérifie l'alignement des colonnes |
| 4 | `20260925000200_rls_helpers.sql` | 137 | Fonctions RLS privées |
| 5 | `20260925000300_rls_policies.sql` | 270 | RLS + 32 politiques + grants |
| 6 | `20260925000400_state_transitions.sql` | 235 | 8 fonctions de transition |
| 7 | `20260925000500_rls_transitions_fix.sql` | 45 | Retire le FORCE sur missions |
| 8 | `20260925000600_assignment_insert_fix.sql` | 114 | Politique d'insertion des affectations |
| 9 | `20260925000700_signup_triggers_fix.sql` | 88 | Retire le FORCE sur profiles, profile_roles, wallets |

### Pourquoi l'étape 1 est à nouveau nécessaire

La migration `00100` utilise `create table if not exists`. Tant que `profiles` et
`missions` existaient, cette instruction **ne faisait rien**. Maintenant qu'elles
ont disparu, elle va réellement les créer, avec toutes leurs colonnes.

Les 10 autres tables existent déjà : pour elles, l'instruction reste sans effet.
C'est exactement le comportement souhaité.

### L'étape 2 est la plus importante

Sans elle, la base fonctionnerait mais **sans aucune garantie d'intégrité** :
`agent_profiles.profile_id` pourrait pointer vers un profil inexistant,
`reviews.mission_id` vers une mission fantôme. Aucune erreur ne le signalerait.

---

## ÉTAPE 10 — RAFRAÎCHIR LE CACHE

Dans le SQL Editor, `Ctrl + A` pour tout effacer, puis **tapez à la main** :

    NOTIFY pgrst, 'reload schema';

Sans cela, PostgREST continue de croire que `profiles` et `missions` n'existent pas.

---

## ÉTAPE 11 — VÉRIFICATION RAPIDE

Fichier : `supabase\verification\VERIFICATION_RAPIDE.sql` (187 lignes)

✅ Attendu : 13 lignes, **toutes en `OK`**, avec ces valeurs :

| # | Contrôle | Attendu |
|---|---|---|
| 1 | Tables présentes | 12 |
| 2 | Tables sans RLS | 0 |
| 3 | Tables sans RLS ni politique | 0 |
| 4 | Politiques RLS | 33 ou plus |
| 5 | Écriture colonnes sensibles | 0 |
| 6 | Client ne peut pas créer un profil | 0 |
| 7 | Colonnes profiles+missions | 21 |
| 8 | Triggers inscription | 2 |
| 9 | FORCE RLS absent | 0 |
| 10 | Fonctions de transition | 8 |
| 11 | Helper `can_assign_mission` | 1 |
| 12 | Politique insert affectations | 1 |
| 13 | Droits d'écriture pour `anon` | 0 |

> ⚠️ Le contrôle 4 peut indiquer **plus de 33** si des politiques héritées ont
> survécu sur les anciennes tables. Ce n'est pas grave en soi, mais
> l'étape 12 permet de les identifier nommément.

---

## ÉTAPE 12 — VÉRIFIER L'INTÉGRITÉ ET LES POLITIQUES

Deux fichiers, dans cet ordre :

1. `supabase\verification\DIAGNOSTIC_ETAT.sql` (68 lignes)
   → vérifie que les clés étrangères ont bien été restaurées
2. `supabase\verification\LISTE_POLITIQUES.sql` (132 lignes)
   → liste les politiques marquées `A EXAMINER`

---

## ÉTAPE 13 — TEST DE L'API

Dans le terminal VS Code :

```
npm run check:supabase
```

✅ Attendu : **« RESULTAT : conforme. »**

---

## ÉTAPE 14 — TEST D'INSCRIPTION

C'est le seul test qui prouve que tout fonctionne.

1. `npx expo start`
2. Inscrivez-vous avec une **adresse email neuve**
3. Vous devez voir **« Vérifiez votre messagerie »**
4. Cliquez sur le lien reçu par email
5. Reconnectez-vous
6. **Votre nom doit s'afficher**, sans « Accès indisponible »

---

## EN CAS DE PROBLÈME

Les migrations sont **rejouables** : `create or replace`, `if not exists`,
`drop ... if exists`, et `01000` teste l'existence de chaque contrainte avant de
la créer. Vous pouvez recommencer une étape sans risque.

Si une migration échoue, envoyez-moi : le nom du fichier, le message **en
entier**, et la ligne mentionnée.
