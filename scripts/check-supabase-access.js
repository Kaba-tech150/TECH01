/**
 * Contrôle d'accès à l'API REST Supabase — SecuGuard.
 *
 * But : vérifier, en LECTURE SEULE, que le projet distant est réellement
 * protégé. Aucune donnée n'est écrite, aucun compte n'est créé.
 *
 * POURQUOI CE SCRIPT A ÉTÉ RÉÉCRIT (2026-09-26)
 * ------------------------------------------------
 * La version précédente classait HTTP 401 comme « OK conforme ». C'était un
 * faux vert : elle ne distinguait pas
 *
 *   - une RLS active qui refuse la lecture   -> situation SAINE
 *   - l'absence pure et simple de droits      -> configuration CASSÉE
 *
 * Sur le projet `awexvvfhfzqovsvtwjfr`, c'est la seconde situation : les 12
 * tables renvoient `42501 permission denied for schema public`, donc le rôle
 * `anon` n'a pas le droit USAGE sur le schéma. Aucun droit n'étant accordé,
 * aucune politique n'est même évaluée. Le script annonçait pourtant
 * « conforme sur les 12 tables ».
 *
 * Le script teste désormais aussi les 8 fonctions de transition, dont
 * l'absence (PGRST202) prouve qu'une migration n'a pas été appliquée.
 *
 * LECTURE DES RÉPONSES
 *   200                      ALERTE : la table se lit SANS authentification
 *   404 + PGRST205           ALERTE : la table n'existe pas
 *   401/403 + 42501 "schema" ALERTE : droits manquants au niveau du schéma
 *   401/403 + 42501 "table"  OK     : la RLS refuse, c'est le but recherché
 *
 * Usage : npm run check:supabase
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

if (!fs.existsSync(envPath)) {
  console.error('Fichier .env introuvable :', envPath);
  process.exit(1);
}

const readEnvValue = (key) => {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = readEnvValue('EXPO_PUBLIC_SUPABASE_URL');
const anonKey = readEnvValue('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !anonKey) {
  console.error(
    'EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY absente du .env.',
  );
  process.exit(1);
}

const TABLES = [
  'profiles',
  'profile_roles',
  'agent_profiles',
  'company_profiles',
  'documents',
  'missions',
  'mission_assignments',
  'wallets',
  'transactions',
  'reviews',
  'messages',
  'notifications',
  'villes',
];

// Table volontairement absente : sert de témoin. Si elle répond comme les
// autres, c'est que le test ne distingue plus absence et accès refusé, et il
// ne faut alors rien croire du reste du rapport.
const CONTROL_TABLE = 'zzz_table_inexistante_temoin';

// Les paramètres d'une RPC PostgREST sont un objet dont les CLÉS sont les
// NOMS d'arguments de la fonction. Une clé d'un seul coup, un seul nom : le
// script ne pouvait donc interroger que des fonctions à un seul argument.
//
// C'EST EXACTEMENT CE QUI A FAIT LE FAUX VERT DU 2026-09-28.
//
// `pointer_depart` a deux paramètres — `target_assignment_id` ET
// `p_rapport` — et la sondee avec la seule cle `target_assignment_id` levait
// `PGRST202 fonction introuvable`. Le script concluait « pas installee », et
//.signalait une anomalie sur une fonction tres bien installee, tres bien
//executee, et correctement cablee dans l'application.
//
// Le controle 25, lui, ne regardait que `proname` : un bon nom et une
// mauvaise signature passaient tous les deux.
//
// Un diagnostic qui accuse la base doit pouvoir se tromper SUR LA BASE. Il
// doit pouvoir se tromper sur LUI-MEME, et le dire.
const PARAMS_UUID = '00000000-0000-0000-0000-000000000000';
const VALEURS_ESSENTIELLES = { text: '' };

const buildRpcBody = (parameters) =>
  Object.fromEntries(
    parameters.map(([name, kind]) => [
      name,
      VALEURS_ESSENTIELLES[kind] ?? PARAMS_UUID,
    ]),
  );

const RPCS = [
  { name: 'publish_mission', parameters: [['target_mission_id', 'uuid']] },
  { name: 'cancel_mission', parameters: [['target_mission_id', 'uuid']] },
  { name: 'complete_mission', parameters: [['target_mission_id', 'uuid']] },
  // Migration `20260928002400`. `complete_mission` reste dans la liste : elle
  // existe, et la retirer ferait perdre le repere d'un passage anterieur.
  //
  // `cloturer_mission` la REMPLACE cote application, et pas seulement en plus.
  // Elle fait avancer la mission ET ses affectations dans la meme operation —
  // `complete_mission` ne touchait que la mission, et laissait l'affectation
  // `accepted`. Le client voyait donc « Terminee » et « Acceptee » sur le meme
  // ecran.
  { name: 'cloturer_mission', parameters: [['target_mission_id', 'uuid']] },
  // Migrations `20260928002200`. `pointer_arrivee` fait passer la mission
  // `accepted` -> `in_progress`. `pointer_depart` met fin a la vacation de
  // l'agent SANS cloturer la mission — c'est le client qui decide — et
  // RECOIT LE RAPPORT DANS LE MEME APPEL.
  //
  // Le rapport se redacte au moment du depart : demander a l'agent de revenir
  // plus tard pour ecrire ce qu'il a constate serait lui faire faire deux fois
  // le meme travail. C'est aussi pour cela que la fonction prend DEUX
  // parametres, et non un.
  { name: 'pointer_arrivee', parameters: [['target_assignment_id', 'uuid']] },
  {
    name: 'pointer_depart',
    parameters: [['target_assignment_id', 'uuid'], ['p_rapport', 'text']],
  },
  { name: 'mark_mission_paid', parameters: [['target_mission_id', 'uuid']] },
  { name: 'open_mission_dispute', parameters: [['target_mission_id', 'uuid']] },
  { name: 'accept_assignment', parameters: [['target_assignment_id', 'uuid']] },
  { name: 'reject_assignment', parameters: [['target_assignment_id', 'uuid']] },
  { name: 'complete_assignment', parameters: [['target_assignment_id', 'uuid']] },
];

// Fonctions de diagnostic qui n'ont AUCUNE raison d'exister en production.
//
// `diagnostic_rls` a ete installee temporairement pour mesurer `auth.uid()`
// dans le role `authenticated` (migration 20260926001300). Elle est retiree
// par la migration 20260926001500.
//
// Elle ne donne acces a aucune donnee utilisateur, uniquement a des
// metadonnees de catalogue. Mais elle DECRIT la politique RLS et les droits
// accordes a quiconque est authentifie : c'est une cartographie offerte a un
// attaquant, et elle n'a rien a faire dans un code livre.
//
// Ce controle existe parce que le 2026-09-27 la fonction etait TOUJOURS
// exposee en production, alors que `check:supabase` annonçait « conforme ».
// C'etait un faux vert : le script ne cherchait que les 8 fonctions de
// transition, et ignorait tout ce qui ne fait pas partie de cette liste.
const FONCTIONS_A_INTERDIRE = ['diagnostic_rls'];

const host = new URL(supabaseUrl).host;
console.log('Projet Supabase :', host);
console.log('Lecture seule : aucune donnee ne sera ecrite.\n');

const anomalies = [];

const record = (target, message) => {
  anomalies.push({ target, message });
};

const parsePostgrestError = (body) => {
  try {
    const parsed = JSON.parse(body);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (first && typeof first === 'object') {
      return {
        code: typeof first.code === 'string' ? first.code : null,
        message: typeof first.message === 'string' ? first.message : '',
      };
    }
  } catch {
    // corps non JSON : le traitement se poursuit
  }
  return { code: null, message: body };
};

/**
 * Vérifie que la clé anon est acceptée par le service d'authentification.
 * Sans ce contrôle, un 401 sur les tables pourrait provenir d'une clé
 * invalide et non d'une politique de sécurité.
 */
const checkApiKey = async () => {
  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: anonKey },
  });

  if (response.status !== 200) {
    record('cle anon', `HTTP ${response.status} sur /auth/v1/health`);
    console.log(`  ALERTE   cle anon               HTTP ${response.status} - cle refusee`);
    return;
  }

  console.log("  OK       cle anon               acceptee par le service d'authentification");
};

const checkControlTable = async () => {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${CONTROL_TABLE}?select=*&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
  );
  const body = await response.text();
  const { code } = parsePostgrestError(body);

  if (response.status === 404 && code === 'PGRST205') {
    console.log('  OK       temoin                 table inexistante bien signalee PGRST205');
    return;
  }

  record(
    'temoin',
    `une table absente a repondu HTTP ${response.status} : le diagnostic ne distingue plus absence et acces refuse`,
  );
  console.log(
    `  ALERTE   temoin                 HTTP ${response.status} - le test de reference a echoue`,
  );
};

const checkTable = async (table) => {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`;

  let response;
  let body;
  try {
    response = await fetch(url, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    body = await response.text();
  } catch (error) {
    record(table, `erreur reseau : ${error.message}`);
    console.log(`  ALERTE   ${table.padEnd(22)} erreur reseau : ${error.message}`);
    return;
  }

  if (response.status === 200) {
    record(table, 'table lue sans authentification');
    console.log(`  ALERTE   ${table.padEnd(22)} HTTP 200 - lue SANS authentification`);
    return;
  }

  const { code, message } = parsePostgrestError(body);

  if (response.status === 404 && code === 'PGRST205') {
    record(table, 'table absente du cache PostgREST');
    console.log(`  ALERTE   ${table.padEnd(22)} table absente du cache PostgREST`);
    return;
  }

  if (response.status === 401 || response.status === 403) {
    const lowered = message.toLowerCase();

    if (lowered.includes('schema')) {
      record(
        table,
        'droits manquants sur le schema public : aucune politique RLS n est evaluee',
      );
      console.log(
        `  ALERTE   ${table.padEnd(22)} droits absents sur le SCHEMA public (RLS jamais atteinte)`,
      );
      return;
    }

    console.log(`  OK       ${table.padEnd(22)} acces refuse par la RLS (attendu)`);
    return;
  }

  record(table, `HTTP ${response.status} ${code ?? ''} ${message}`);
  console.log(`  ALERTE   ${table.padEnd(22)} HTTP ${response.status} - ${message.slice(0, 90)}`);
};

const checkRpc = async ({ name: fn, parameters }) => {
  // Appel volontairement refusé : la fonction doit exister dans le cache et
  // refuser le rôle anon. Aucun effet de bord n'est possible, l'identifiant
  // transmis n'existant pas et la fonction levant une exception avant toute
  // écriture.
  //
  // ⚠️ LE CORPS N'EST PAS NÉGLIGEABLE — c'est un 1er argument, pas un détail.
  // PostgREST résout la fonction par SIGNATURE : un corps qui n'envoie pas
  // TOUS les paramètres fait échouer l'appel en `PGRST202`, et le script
  // conclut alors à tort que la fonction n'est pas installée. C'est arrivé le
  // 2026-09-28 avec `pointer_depart`, dont le second paramètre `p_rapport` a
  // été oublié ici — alors que l'application l'envoyait, lui, correctement.
  const noms = parameters.map(([name]) => name);
  const body = buildRpcBody(parameters);

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const corps = await response.text();
  const { code, message } = parsePostgrestError(corps);

  if (response.status === 404 && code === 'PGRST202') {
    // PGRST202 signifie que PostgREST n'a trouvé aucune fonction de ce nom
    // acceptant CE jeu de paramètres. Trois causes très différentes : la
    // fonction n'existe pas, ou un paramètre envoyé est incorrect, ou il en
    // MANQUE un.
    //
    // On accuse donc le SCRIPT en premier, et la base seulement ensuite. Un
    // diagnostic qui ne sait pas se donner tort est un diagnostic qui accuse.
    const parametreManquant = noms.find((nom) => !message.includes(nom));
    const nomInconnu = noms.every((nom) => !message.includes(nom));

    let raison;
    if (nomInconnu) {
      raison = 'LE SCRIPT interroge avec des parametres qu AUCUNE fonction de ce nom';
    } else if (parametreManquant) {
      raison = `LE SCRIPT omet le parametre ${parametreManquant} dans son appel`;
    } else {
      raison = 'la fonction n est pas installee';
    }

    record(`rpc ${fn}`, raison);
    console.log(`  ALERTE   rpc ${fn.padEnd(22)} ${raison}`);
    console.log(
      `           ${fn} existe peut-etre tres bien : verifier avec`,
    );
    console.log(
      `           select proname, pg_get_function_identity_arguments(oid)`,
    );
    console.log(`             from pg_proc where proname = '${fn}';`);
    return;
  }

  if (response.status === 401 || response.status === 403) {
    if (message.toLowerCase().includes('schema')) {
      console.log(`  INFO     rpc ${fn.padEnd(22)} conclusion impossible : schema bloque`);
      return;
    }
    console.log(`  OK       rpc ${fn.padEnd(22)} existe et refuse le role anon`);
    return;
  }

  record(`rpc ${fn}`, `HTTP ${response.status} ${code ?? ''} ${message}`);
  console.log(`  ALERTE   rpc ${fn.padEnd(22)} HTTP ${response.status} - ${message.slice(0, 80)}`);
};

/**
 * Verifie qu'aucune fonction de diagnostic ne subsiste dans le schema public.
 *
 * L'appel est volontairement SANS corps : PostgREST resout la fonction par
 * signature, donc une fonction sans parametre est trouvee sans argument. On lit
 * la reponse, on ne l'execute pas dans un but de donnees.
 *
 * LECTURE DES REPONSES — c'est la distinction qui compte :
 *   404 + PGRST202            OK      : la fonction n'existe pas
 *   401/403 + 42501 "function" ALERTE : ELLE EXISTE, l'API refuse seulement
 *                                      le role anon
 *
 * Une reponse 42501 sur une fonction nommee ne prouve donc PAS que la base
 * est saine : elle prouve que la fonction est la, et que seul `anon` est
 * refuse. Or le role `authenticated` y a acces.
 */
const checkFonctionInterdite = async (fn) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const body = await response.text();
  const { code, message } = parsePostgrestError(body);

  // La fonction n'existe pas : c'est l'etat attendu et souhaite.
  if (response.status === 404 && code === 'PGRST202') {
    console.log(`  OK       ${fn.padEnd(22)} absente du catalogue`);
    return;
  }

  // Elle existe. La raison est precisee, car « elle existe » ne suffirait pas a
  // expliquer quoi que ce soit au commanditaire.
  record(
    fn,
    'FONCTION DE DIAGNOSTIC EXPOSEE : elle decrit la politique RLS et les droits de la base',
  );
  console.log(
    `  ALERTE   ${fn.padEnd(22)} EXPOSEE en base (HTTP ${response.status}) - ` +
      'fonction de diagnostic a supprimer',
  );
  if (code) {
    console.log(`           code serveur : ${code}`);
  }
  if (message) {
    console.log(`           message      : ${message.slice(0, 120)}`);
  }
};

/**
 * Verifie que CHAQUE table de metier est lisible par un client authentifie.
 *
 * CE CONTROLE EXISTE PARCE QUE LE 2026-09-27, IL N'Y AVAIT AUCUN.
 *
 * `agent_profiles` n'avait, pour la lecture, que cette politique :
 *
 *   using (profile_id = (select auth.uid()) or private.is_admin())
 *
 * Lisible par l'agent lui-meme, ou un administrateur. **Pas par un client.** La
 * recherche d'un client ne pouvait donc RIEN renvoyer, pour aucun nombre de
 * fiches : la liste etait vide par construction, et non par accident.
 *
 * Le parcours « creer ma fiche » semblait fonctionner — il fonctionnait, en
 * ecrivant la ligne — et `check:supabase` annonçait « conforme ». Aucun des
 * deux ne pouvait le voir : le script ne teste que le role `anon`, et une
 * politique qui refuse un client refuse aussi `anon`.
 *
 * C'est la 4e fois qu'une absence de controle laisse passer un defaut :
 * `mission_assignments` sans politique insert, le `DEFAULT auth.uid()` evalue
 * au mauvais moment, le `grant select` manquant, puis cette politique.
 * L'absence de controle ne prouve rien.
 *
 * COMMENT CE CONTROLE PEUT ECHOUER SANS JETON
 *
 * Il teste le role `anon`, qui n'est PAS un client : les tables fermees au
 * client restent fermees a `anon`, et le test ne peut pas les distinguer. Il
 * distingue donc ce qu'il peut, et signale explicitement ce qu'il ne peut pas.
 * Ce qui compte ici est le CONTRAIRE du test de lecture : on cherche une table
 * qui, elle, s'ouvre.
 */
const checkVisibiliteMetier = async () => {
  console.log('\n--- Visibilite metier (ce que ce script ne peut PAS prouver) ---');

  // Tables dont la lecture par un client fait partie du produit : la liste
  // des agents dans la recherche, celle des villes, l'historique des missions.
  // Une table absente de cette liste n'est pas « validee » : elle n'est pas
  // testee, et le script le dit.
  const ATTENDUES_PAR_UN_CLIENT = ['villes', 'missions', 'mission_assignments'];

  for (const table of ATTENDUES_PAR_UN_CLIENT) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );

    if (response.status === 200) {
      // Anormal : ces tables ont toutes une politique de lecture fermee au
      // public. Un 200 ici signifierait que la table est ouverte.
      record(table, 'lue par le role anon : politique de lecture absente ou trop large');
      console.log(`  ALERTE   ${table.padEnd(22)} lue SANS authentification`);
    } else {
      console.log(
        `  OK       ${table.padEnd(22)} fermee au role anon (attendu) - ` +
          `ce test ne dit RIEN de la visibilite par un client`,
      );
    }
  }

  console.log(
    '\n  AVERTISSEMENT Ces tests ne disent rien de la visibilite par un CLIENT.\n' +
      '  Le role anon est refuse presque partout, y compris sur les tables qu un\n' +
      '  client doit voir. Une politique qui ferme au client ferme aussi a anon,\n' +
      '  et les deux cas sont indiscernables d ici.\n' +
      '\n  Le 2026-09-27, agent_profiles etait dans cette categorie : invisible\n' +
      '  pour un client, invisible pour anon, et « conforme » selon ce script.\n' +
      '  Le seul test qui le revele est FONCTIONNEL : creer une fiche, puis la\n' +
      '  chercher depuis un autre compte. Voir RAPPORT_PROJET.md.',
  );
};

const run = async () => {
  console.log('--- Authentification de la cle anon ---');
  await checkApiKey();
  await checkControlTable();

  console.log('\n--- Tables du schema public ---');
  for (const table of TABLES) {
    await checkTable(table);
  }

  console.log('\n--- Fonctions de transition d etat ---');
  for (const fn of RPCS) {
    await checkRpc(fn);
  }

  console.log('\n--- Fonctions de diagnostic (doivent etre absentes) ---');
  for (const fn of FONCTIONS_A_INTERDIRE) {
    await checkFonctionInterdite(fn);
  }

  await checkVisibiliteMetier();

  const schemaBlocked = anomalies.some((a) => a.message.includes('schema public'));

  console.log('\n============================================================');
  console.log('BILAN');
  console.log('============================================================');

  if (anomalies.length === 0) {
    console.log('RESULTAT : conforme.');
    console.log('Les tables existent, la lecture sans session est refusee,');
    // LE NOMBRE EST CALCULE, JAMAIS ECRIT EN DUR.
    //
    // La ligne disait « les 8 fonctions » depuis le debut. Il y en a 11. Le
    // rapport declarait donc conforme un etat qu'il ne decrivait pas, et le
    // lecteur devait le croire sur parole — c'est exactement ce que ce script
    // existe pour empecher.
    //
    // Regle : un rapport ne dit jamais un nombre qu'il ne mesure pas. S'il
    // affiche une valeur, elle vient de la liste testee.
    console.log(
      `les ${RPCS.length} fonctions de transition sont presentes,`,
    );
    console.log('et aucune fonction de diagnostic ne subsiste.');
    console.log('');
    console.log('Relisez malgre tout le controle 2 de');
    console.log('supabase/verification/VERIFICATION_POST_MIGRATION.sql :');
    console.log("l'API REST ne prouve pas que la RLS est activee, seulement");
    console.log('que les droits sont accordes.');
    process.exit(0);
  }

  console.log(`RESULTAT : ${anomalies.length} anomalie(s).`);
  console.log('');

  if (schemaBlocked) {
    console.log('CAUSE PROBABLE : les migrations 00200, 00300, 00400 et 00500');
    console.log("n'ont pas ete appliquees au projet distant.");
    console.log('');
    console.log("Symptome visible dans l'application : l'ecran");
    console.log('"Acces indisponible / permission denied for schema public".');
    console.log('La connexion aboutit, mais la lecture du profil echoue.');
    console.log('');
    console.log('ACTIONS, dans le SQL Editor du projet :');
    console.log('  1. Coller et executer, dans cet ordre :');
    console.log('       20260925000200_rls_helpers.sql');
    console.log('       20260925000300_rls_policies.sql');
    console.log('       20260925000400_state_transitions.sql');
    console.log('       20260925000500_rls_transitions_fix.sql');
    console.log('  2. Recharger le cache PostgREST :');
    console.log("       NOTIFY pgrst, 'reload schema';");
    console.log('  3. Relancer : npm run check:supabase');
    console.log('');
    console.log('00100 est deja appliquee : ne la rejouez pas.');
    console.log('Detail des etapes :');
    console.log('supabase/verification/GUIDE_APPLICATION_MIGRATIONS.md');
    console.log('');
  }

  const other = anomalies.filter((a) => !a.message.includes('schema public'));
  if (other.length > 0) {
    console.log('AUTRES ANOMALIES :');
    for (const a of other) {
      console.log(`  - ${a.target} : ${a.message}`);
    }
    console.log('');
  }

  // Diagnostic Actionable : une anomalie de fuite ne se corrige pas toute seule.
  // Le script doit dire QUOI coller, sinon le commanditaire fait quoi que ce soit.
  const diagnosticExpose = anomalies.filter((a) =>
    a.message.startsWith('FONCTION DE DIAGNOSTIC EXPOSEE'),
  );

  if (diagnosticExpose.length > 0) {
    console.log('============================================================');
    console.log('ACTION REQUISE : SONDE DE DIAGNOSTIC EXPOSEE');
    console.log('============================================================');
    console.log('');
    console.log('Une fonction de diagnostic vit dans le schema public.');
    console.log("Elle ne contient aucune donnee utilisateur, mais elle DECRIT");
    console.log('la politique RLS et les droits de la base. Elle ne doit pas');
    console.log('survivre a la livraison.');
    console.log('');
    console.log('Dans le SQL Editor du projet :');
    console.log('  1. Ouvrir  supabase\\migrations\\20260926001500_diagnostic_drop.sql');
    console.log('  2. Ctrl+A puis Ctrl+V dans une nouvelle requete, puis Run');
    console.log('  Attendu : "Success. No rows returned"');
    console.log('  3. Relancer : npm run check:supabase');
    console.log('');
  }

  process.exit(1);
};

run().catch((error) => {
  console.error('Le diagnostic a echoue :', error.message);
  process.exit(1);
});
