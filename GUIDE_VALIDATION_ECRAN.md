# Guide de validation à l'écran — SecuGuard

> **Écrit le 2026-09-30, après 17 commits de travail jamais vu à l'écran.**
>
> **Pourquoi ce document existe.** Sur les 27 écrans de l'application, **19 lisent
> la base** et **aucun n'a été ouvert** depuis le début du projet. Tout est
> compilé, exporté, et vérifié par quatre contrôles — mais **aucun de ces
> contrôles ne dit si un écran s'affiche**. C'est la limite que ce projet s'est
> donnée dès son premier défaut, et ce guide est le moyen de la lever.
>
> **Durée : environ 40 minutes**, plus le temps de la préparation.

---

## AVANT DE COMMENCER

### Ce qu'il vous faut

| Prérequis | Comment le vérifier |
|---|---|
| Un **compte client** inscrit | aucun rôle prestataire |
| Un **compte agent** inscrit | **avec une fiche `agent_profiles` complète** |
| Les **deux mots de passe** | ⚠️ ce sont des comptes **jetables**, pas vos comptes réels |
| Le serveur de dev lancé | `npm run web` |

> ⚠️ **Le test écrit des données et clôture des missions.** Une mission close ne
> se rouvre pas, et aucune politique de suppression côté client n'existe. Utilisez
> des comptes que vous pouvez abandonner.

### Le test automatique d'abord, l'écran ensuite

```bash
npm run test:parcours
```

Il joue le parcours complet avec deux comptes réels : **13 étapes, dont 5 cas
négatifs**. Il est plus rapide que la validation manuelle et il vérifie ce que
l'écran ne montre pas — qu'une transition **refusée** l'est bien.

**Renseignez d'abord `.env.test`** (3 valeurs manquantes) :

```
TEST_CLIENT_EMAIL     =   ← à renseigner
TEST_CLIENT_PASSWORD  =   ← à renseigner
TEST_AGENT_EMAIL      =   ✓ déjà renseignée
TEST_AGENT_PASSWORD   =   ← à renseigner
```

**Si le test passe, la validation à l'écran devient une simple relecture.** S'il
échoue, **arrêtez-vous et lisez son message** : il dit l'étape exacte. Valider à
l'écran sans le test ne ferait que constater qu'un écran s'ouvre.

### Ce que le test ne couvre pas

Le test exerce **5 des 11 fonctions de transition** :
`publish_mission`, `accept_assignment`, `pointer_arrivee`, `pointer_depart`,
`cloturer_mission`.

**Les 6 autres ne sont testées nulle part** — ni par le script, ni par ce guide :
`reject_assignment`, `cancel_mission`, `mark_mission_paid`, `open_mission_dispute`,
`complete_mission`, `complete_assignment`. Elles restent **[X] non prouvées**.

---

## ESPACE AGENT — le plus important, et le moins connu

**C'est l'espace que vous n'avez jamais ouvert.** 5 écrans, 85 Ko de code,
**aucun rendu de votre côté**. Commencez par celui-ci.

### 1. `/(agent)` — l'accueil

| Vérifier | Attendu |
|---|---|
| Le bandeau **navy** s'affiche | avec le nom du compte agent |
| **Ma fiche** | affiche zone, tarif, certification, bio |
| **Ma disponibilité** | l'interrupteur reflète `is_available` |
| **Mon portefeuille** | le solde, ou « 0 € » si vide |
| **Missions entrantes** | la liste des demandes |

> **Si l'accueil affiche « Renseigner ma fiche »**, la fiche n'existe pas.
> Le test automatique s'arrête aussi à cette étape. Créez la fiche d'abord.

### 2. `/(agent)/missions-agent` — accepter et refuser

**C'est l'écran le plus critique du projet.** Il contient `accept_assignment` et
`reject_assignment`, **jamais exécutées** depuis le début du projet.

| Action | Ce qui doit se passer | Comment le vérifier |
|---|---|---|
| **Accepter** une demande | l'affectation passe `pending` → `accepted` | le badge change |
| **Refuser** une demande | l'affectation passe `pending` → `rejected` | le badge change |
| **Ouvrir la mission** | mène à `/(agent)/mission/[id]` | l'écran s'affiche |

> **Le refus n'est pas annulable.** Une affectation refusée ne revient pas en
> attente. Faites le test avec une seule demande à la fois.

### 3. `/(agent)/mission/[id]` — l'exécution

**Les 4 pointages. Aucun n'a jamais été vu répondre.**

| Action | Ce qui doit se passer |
|---|---|
| **Pointer mon arrivée** | la mission passe `in_progress`, le chrono démarre |
| **Pointer mon départ et envoyer le rapport** | le rapport part, le chrono s'arrête |
| **Voir mes missions** | l'affectation apparaît `completed` si le client a clôturé |

**Vérifiez aussi que l'ordre est respecté** : le bouton de départ doit être
**inactif** tant que l'arrivée n'est pas pointée. C'est la matrice de transitions
de la migration `02200`, réparée le 28 septembre.

> **Le rapport est le seul geste que le test automatique ne couvre pas.**
> `pointer_depart` le transmet, mais `enregistrerRapport` — l'écriture directe
> sur la colonne `report` — **n'a jamais été exécutée**. C'est le seul point
> réellement à tester à la main.

### 4. `/(agent)/profil-agent` — la fiche

| Vérifier | Attendu |
|---|---|
| Les champs affichent **ce que vous avez saisi** | zone, tarif, certification, bio |
| **Modifier** puis revenir | les valeurs sont **relues en base**, pas seulement en mémoire |

> C'est la seule écriture déjà validée de bout en bout sur cet espace.

### 5. `/(agent)/availability` — la disponibilité

| Vérifier | Attendu |
|---|---|
| Basculer l'interrupteur | `is_available` change en base |
| Recharger l'application | **l'état persiste** |

---

## ESPACE CLIENT

### 6. `/(client)` — l'accueil

| Vérifier | Attendu |
|---|---|
| Les compteurs | missions, prestataires, budget |
| **Rechercher** | mène à `/(client)/search` |

### 7. `/(client)/search` — la recherche

| Vérifier | Attendu |
|---|---|
| Une recherche par nom | **trouve l'agent** — c'est le test qui a révélé le défaut `agent_profiles` invisible |
| Filtrer par ville | la liste se restreint |
| Toucher une carte | mène à la réservation |

### 8. `/(client)/mission/new` — la création

| Vérifier | Attendu |
|---|---|
| Créer une mission | statut `draft`, valeurs **relues en base** |
| **Publier** | statut `published` — première transition jamais exécutée, **réussie** |
| Valider un champ vide | un message en français, pas un message technique |

### 9. `/(client)/prestation/[id]` — la réservation

| Vérifier | Attendu |
|---|---|
| Choisir une mission puis **Réserver** | **2 lignes** créées en base, `status = pending` |

### 10. `/(client)/mission-suivi/[id]` — le suivi

> **Jamais testé.** C'est la moitié manquante de l'étape 6.

| Vérifier | Attendu |
|---|---|
| Le suivi s'affiche | statut, horaires, pointages |
| La clôture est proposée | **seulement** après le départ du prestataire |

### 11. `/(client)/profil-client` — le profil

| Vérifier | Attendu |
|---|---|
| L'identité | nom, email |
| Les **justificatifs** | pièces déposées, statut, expiration |
| Les interrupteurs non configurés | tous marqués **« Non configuré »** |

> Les 16 options non implémentées (2FA, biométrie, RGPD…) **doivent** afficher
> « Non configuré ». Si l'une est active, c'est un défaut : elle promet une
> protection qui n'existe pas.

---

## ESPACE SOCIÉTÉ

**Branché le 2026-09-30, jamais ouvert.**

| Écran | Vérifier |
|---|---|
| `/(company)` | les 4 hooks de données s'affichent |
| `/(company)/profil-societe` | **la fiche société s'affiche** — raison sociale, SIRET, adresse, statut |
| `/(company)/missions-societe` | les affectations reçues, avec leurs pointages |
| `/(company)/team` | les agents rattachés, leur statut, leur disponibilité |

> **Point de vigilance** : un agent dont le nom n'est pas lisible doit afficher
> **« Compte non lisible par votre espace »**, jamais « Agent inconnu » — sinon il
> disparaît de la liste et vous ne saurez pas s'il est réellement rattaché.

---

## ESPACE ADMINISTRATEUR

**Branché le 2026-09-30, jamais ouvert.**

| Écran | Vérifier |
|---|---|
| `/(admin)` | les 6 compteurs sont **réels**, pas des « 0 » en dur |
| `/(admin)/users` | la file de validation, avec les dossiers d'agents et de sociétés |
| `/(admin)/missions-admin` | toutes les missions, filtrables par statut |
| `/(admin)/profil-admin` | vos rôles sont listés |

> **Vérification d'honnêteté, importante :** sur `/(admin)/users`, la carte
> **« Décision hors application »** doit être présente. Elle annonce que la
> validation ne se fait pas dans l'application — aucune des 11 fonctions serveur
> ne change un statut de prestataire. **Si elle a disparu, c'est un défaut** :
> l'écran laisserait croire à un bouton de validation.

---

## L'ÉCRAN 404

> Créé le 2026-09-30, jamais vu à l'écran.

Ouvrez `http://localhost:8081/xyzabc`, une adresse qui n'existe pas.

| Vérifier | Attendu |
|---|---|
| Un message s'affiche | « Cette page n'existe pas » |
| **L'adresse fautive est affichée** | pour pouvoir la transmettre |
| **Revenir à l'accueil** | mène à l'accueil de **votre** rôle |

> Le bouton utilise `getRoleHomeRoute`, pas un espace en dur : un prestataire
> renvoyé vers l'espace client retombait sur une garde qui le refuse, donc sur le
> 404, **en boucle**. Si vous êtes agent et que le bouton vous ramène vers
> l'espace client, c'est un défaut.

---

## CE QUE CE GUIDE NE PROUVE PAS

Soyons clairs sur les limites, c'est la règle du projet :

- **Une seule lecture, un seul compte, une seule fois.** Rien de ce qui est validé
  ici ne prouve que ça marche pour 10 missions simultanées.
- **Les 6 fonctions de transition** listées plus haut restent non prouvées.
- **Les rôles multi-compte** ne sont pas testés : l'écran d'accueil demande quel
  espace utiliser quand il y en a plusieurs, et personne ne l'a vu.
- **`documents`, `reviews`, `messages`, `notifications`** : trois de ces tables
  n'ont **aucun écran**. Ne les cherchez pas.

---

## APRÈS LA VALIDATION

Si un écran ne va pas :

1. **Notez l'URL exacte** et ce qui s'affiche — un écran vide ne dit rien.
2. **Regardez le terminal** : `console.warn` y écrit le détail technique.
3. **N'inventez pas un mot de passe** pour faire passer le test.

Un défaut trouvé à l'écran vaut dix contrôles verts. C'est exactement ce qui s'est
passé le 28 septembre : les 26 contrôles étaient au vert et le parcours était
cassé trois fois.

---

## ENREGISTREMENT

| Date | Espace testé | Compte | Résultat | Défaut trouvé |
|---|---|---|---|---|
| | | | | |

---

*Document de travail, à mettre à jour après chaque session de test. La source de
vérité sur l'état du projet reste `RAPPORT_PROJET.md`.*
