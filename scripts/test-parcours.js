/**
 * Test fonctionnel du parcours complet client -> prestataire. SecuGuard.
 *
 * POURQUOI CE FICHIER EXISTE
 * -------------------------
 * Dix défauts ont survécu à une chaîne de contrôles entièrement verte. Tous les
 * contrôles du projet - 26 contrôles SQL, `check:supabase` - mesurent l'ÉTAT de
 * la base : les tables existent, les politiques sont là, les droits sont
 * accordés, les fonctions sont au catalogue.
 *
 * Aucun ne mesure ce que PostgreSQL et PostgREST font RÉELLEMENT d'une requête.
 * C'est pour cela que la matrice pouvait ne contenir aucune ligne pour un statut
 * sans qu'aucun contrôle ne le voie, que des fonctions `STABLE` pouvaient
 * échouer, et que la mission pouvait dire « Terminée » pendant que l'affectation
 * disait « Acceptée ».
 *
 * Ce fichier ne mesure pas un état. Il EXÉCUTE le parcours et regarde ce que
 * les deux camps voient. C'est le seul genre de contrôle qui aurait attrapé ces
 * dix défauts.
 *
 * CE QU'IL FAIT
 * -------------
 * Il se connecte avec deux VRAIS comptes et joue le parcours de bout en bout,
 * en vérifiant le statut lu après chaque étape. Il vérifie aussi les cas
 * NÉGATIFS - ce qui doit être refusé - parce qu'une-transition qui n'a jamais
 * été essayée est une transition dont on ne sait rien.
 *
 * IL ÉCRIT DES DONNÉES. Il crée une mission par exécution, avec un titre unique.
 * Il n'y a pas de politique de suppression côté client : ces missions
 * s'accumulent et c'est voulu. Elles sont reconnaissables à leur préfixe de
 * titre.
 *
 * ⚠️ IL FAUT DEUX COMPTES RÉELS, AVEC LEUR MOT DE PASSE.
 * Rien ne peut être inventé : une session Supabase se crée avec un vrai couple
 * email / mot de passe, et un mot de passe ne se devine pas.
 *
 *   1. Copiez `.env.test.example` en `.env.test` (le fichier est IGNORÉ par git,
 *      donc un mot de passe ne peut pas être poussé par accident).
 *   2. Renseignez les quatre valeurs.
 *   3. `npm run test:parcours`
 *
 * Le compte agent doit avoir une fiche `agent_profiles` complète. Le compte
 * client n'en a pas besoin : il n'en crée pas.
 *
 * LECTURE DES RÉSULTATS
 * ---------------------
 *   REUSSI   l'étape a fait ce qu'elle devait faire
 *   REFUSE   la base a refusé, et c'était ATTENDU
 *   ALERTE   la base a accepté ou refusé autre chose que prévu
 *
 * Un `ALERTE` n'est pas un échec de test : c'est un défaut trouvé. C'est
 * exactement ce que ce fichier est censé produire.
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const envTestPath = path.join(projectRoot, '.env.test');
const envPath = path.join(projectRoot, '.env');

const lireEnv = (file) => {
  if (!fs.existsSync(file)) return {};
  const contenu = fs.readFileSync(file, 'utf8');
  const sortie = {};
  for (const ligne of contenu.split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !ligne.trim().startsWith('#')) sortie[m[1]] = m[2].trim();
  }
  return sortie;
};

const conf = { ...lireEnv(envPath), ...lireEnv(envTestPath) };

const REQUIS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'TEST_CLIENT_EMAIL',
  'TEST_CLIENT_PASSWORD',
  'TEST_AGENT_EMAIL',
  'TEST_AGENT_PASSWORD',
];

const manquants = REQUIS.filter((cle) => !conf[cle]);

if (manquants.length > 0) {
  console.error('\nCONFIGURATION INCOMPLETE - aucun test n a ete execute.\n');
  console.error('Il manque :\n');
  for (const cle of manquants) console.error(`  - ${cle}`);
  console.error(
    '\nCopiez .env.test.example en .env.test, puis renseignez ces valeurs.',
  );
  console.error(
    'Ce fichier est ignore par git : un mot de passe ne partira pas en ligne.\n',
  );
  process.exit(1);
}

const URL_SUPABASE = conf.EXPO_PUBLIC_SUPABASE_URL;
const CLE_ANON = conf.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const PREFIXE_TITRE = '[TEST]';

// ---------------------------------------------------------------------------
// Client HTTP minimal
// ---------------------------------------------------------------------------
const appel = async (chemin, { methode = 'GET', jeton, corps, prefer } = {}) => {
  const headers = {
    apikey: CLE_ANON,
    Authorization: `Bearer ${jeton ?? CLE_ANON}`,
  };
  if (corps !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  const reponse = await fetch(`${URL_SUPABASE}${chemin}`, {
    method: methode,
    headers,
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });

  const texte = await reponse.text();
  let data = null;
  try {
    data = texte ? JSON.parse(texte) : null;
  } catch {
    data = texte;
  }
  return { statut: reponse.status, data };
};

const rpc = (jeton, nom, args) =>
  appel(`/rest/v1/rpc/${nom}`, { methode: 'POST', jeton, corps: args });

const erreur = (r) => {
  const d = r.data;
  if (Array.isArray(d) && d[0]) return d[0].message ?? JSON.stringify(d[0]);
  if (d && typeof d === 'object') return d.message ?? d.hint ?? d.code ?? JSON.stringify(d);
  return String(d);
};

// ---------------------------------------------------------------------------
// Journal
//
// Un test qui n'affiche qu'un « OK » final ne montre pas OÙ ça a coincé. Chaque
// étape est journalisée au moment où elle s'exécute, avec le statut lu APRÈS
// l'appel - jamais la valeur qu'on’espère.
// ---------------------------------------------------------------------------
const resultats = [];

const etape = (numero, libelle, attendu, obtenu, ok) => {
  resultats.push({ numero, libelle, attendu, obtenu, ok });
  console.log(`  ${ok ? 'REUSSI' : 'ALERTE '}  ${numero}. ${libelle}`);
  console.log(`          attendu : ${attendu}`);
  console.log(`          obtenu  : ${obtenu}`);
};

const connexion = async (email, motDePasse, role) => {
  const r = await appel('/auth/v1/token?grant_type=password', {
    methode: 'POST',
    corps: { email, password: motDePasse },
  });
  if (r.statut !== 200 || !r.data?.access_token) {
    console.error(`\nCONNEXION ${role} IMPOSSIBLE : ${email}`);
    console.error(`  -> ${erreur(r)}`);
    console.error(
      '\nLe compte existe-t-il ? Le mot de passe est-il correct ?\n',
    );
    process.exit(1);
  }
  console.log(`  session ${role} : ${r.data.user.email}`);
  return r.data.access_token;
};

const statutMission = async (jeton, id) => {
  const r = await appel(`/rest/v1/missions?select=status&id=eq.${id}`, { jeton });
  return Array.isArray(r.data) && r.data[0]
    ? r.data[0].status
    : `inconnu (${r.statut})`;
};

const statutAffectation = async (jeton, id) => {
  const r = await appel(
    `/rest/v1/mission_assignments?select=status,check_in_time,check_out_time,report&id=eq.${id}`,
    { jeton },
  );
  return Array.isArray(r.data) && r.data[0] ? r.data[0] : null;
};

const refuser = (r) => (r.statut >= 400 ? 'refuse' : 'ACCEPTE');

// Le titre de la mission du tour, pour le rappeler au bilan même si le parcours
// s'est interrompu avant de la créer.
let titreCourant = '(aucune mission creee)';

const main = async () => {
  console.log('\n============================================================');
  console.log('TEST FONCTIONNEL DU PARCOURS - lecture ET ecriture');
  console.log('============================================================\n');
  console.log(`  projet : ${new URL(URL_SUPABASE).host}\n`);

  console.log('-- CONNEXIONS --------------------------------------------------');
  const jetonClient = await connexion(
    conf.TEST_CLIENT_EMAIL, conf.TEST_CLIENT_PASSWORD, 'client',
  );
  const jetonAgent = await connexion(
    conf.TEST_AGENT_EMAIL, conf.TEST_AGENT_PASSWORD, 'agent',
  );

  // La fiche du prestataire. `agent_profiles.id` n'est PAS `auth.uid()` : les
  // deux identifiants sont distincts, et `mission_assignments.agent_id`
  // référence le premier. Filtrer sur l'identifiant utilisateur ne renvoie donc
  // jamais de ligne.
  const rUser = await appel('/auth/v1/user', { jeton: jetonAgent });
  const rFiche = await appel(
    `/rest/v1/agent_profiles?select=id,status&profile_id=eq.${rUser.data.id}`,
    { jeton: jetonAgent },
  );
  const idAgent =
    Array.isArray(rFiche.data) && rFiche.data[0] ? rFiche.data[0].id : null;

  if (!idAgent) {
    console.error('\nLE COMPTE AGENT N A PAS DE FICHE agent_profiles.');
    console.error('  Le parcours ne peut pas aller plus loin : rien a affecter.\n');
    process.exit(1);
  }
  console.log(`  fiche agent : ${idAgent}`);

  const titre = `${PREFIXE_TITRE} parcours ${new Date().toISOString()}`;
  titreCourant = titre;
  const debut = new Date(Date.now() + 3600_000).toISOString();
  const fin = new Date(Date.now() + 5 * 3600_000).toISOString();

  console.log('\n-- PARCOURS ----------------------------------------------------');

  // 1. Création
  //
  // `Prefer: return=minimal`, JAMAIS `return=representation` : c'est le piège
  // P1, un insert qui échoue en 403 parce que la RELECTURE est refusée, alors
  // que l'écriture est passée. L'identifiant se récupère ensuite par une
  // lecture, comme le fait l'application.
  const rCreate = await appel('/rest/v1/missions', {
    methode: 'POST',
    jeton: jetonClient,
    prefer: 'return=minimal',
    corps: {
      client_id: '00000000-0000-0000-0000-000000000000',
      title: titre,
      address: '1 rue du test',
      city: 'Paris',
      start_time: debut,
      end_time: fin,
      agent_count: 1,
    },
  });
  const rTrouve = await appel(
    `/rest/v1/missions?select=id,status&title=eq.${encodeURIComponent(titre)}`,
    { jeton: jetonClient },
  );
  const mission = Array.isArray(rTrouve.data) ? rTrouve.data[0] : null;
  etape(
    1, 'le client cree une mission',
    'mission creee, statut draft',
    mission ? `statut ${mission.status}` : erreur(rCreate),
    Boolean(mission) && mission.status === 'draft',
  );
  if (!mission) return;
  const idMission = mission.id;

  // 2. Publication
  const rPublish = await rpc(jetonClient, 'publish_mission', {
    target_mission_id: idMission,
  });
  const apresPublish = await statutMission(jetonClient, idMission);
  etape(
    2, 'le client publie la mission',
    'published',
    apresPublish === 'published'
      ? apresPublish
      : `${apresPublish} / ${erreur(rPublish)}`,
    apresPublish === 'published',
  );

  // 3. Réservation
  //
  // `Prefer: return=minimal`, comme l'insertion de la mission : c'est le piège
  // P1. Un `.insert().select()` fait échouer l'appel en 403 parce que la
  // RELECTURE passe par une politique que l'agent ne satisfait pas, alors que
  // l'écriture est passée. L'identifiant se relit ensuite, comme le fait
  // l'application.
  const rAffectation = await appel('/rest/v1/mission_assignments', {
    methode: 'POST',
    jeton: jetonClient,
    prefer: 'return=minimal',
    corps: { mission_id: idMission, agent_id: idAgent },
  });
  const rAffectLue = await appel(
    `/rest/v1/mission_assignments?select=id,status&mission_id=eq.${idMission}`,
    { jeton: jetonClient },
  );
  const affectation =
    Array.isArray(rAffectLue.data) && rAffectLue.data[0]
      ? rAffectLue.data[0]
      : null;
  etape(
    3, 'le client reserve le prestataire',
    'affectation creee, statut pending',
    affectation ? `statut ${affectation.status}` : erreur(rAffectation),
    Boolean(affectation) && affectation.status === 'pending',
  );
  if (!affectation) return;
  const idAffectation = affectation.id;

  // 4. CAS NÉGATIF - clore avant d'avoir commencé
  //
  // Une mission PUBLIÉE n'est pas clôturable. C'est une garantie de la matrice
  // de transitions, et elle ne se vérifie qu'en essayant.
  const rClotureTot = await rpc(jetonClient, 'cloturer_mission', {
    target_mission_id: idMission,
  });
  etape(
    4, 'NEGATIF : clore une mission qui n a pas commence',
    'refuse par la base',
    refuser(rClotureTot),
    rClotureTot.statut >= 400,
  );

  // 5. Acceptation
  const rAccepte = await rpc(jetonAgent, 'accept_assignment', {
    target_assignment_id: idAffectation,
  });
  const apresAccepte = await statutAffectation(jetonAgent, idAffectation);
  const missionApresAccepte = await statutMission(jetonClient, idMission);
  etape(
    5, 'le prestataire accepte',
    'affectation accepted, mission accepted',
    `affectation ${apresAccepte?.status}, mission ${missionApresAccepte}`
      + (missionApresAccepte !== 'accepted' ? ` / ${erreur(rAccepte)}` : ''),
    apresAccepte?.status === 'accepted' && missionApresAccepte === 'accepted',
  );

  // 6. CAS NÉGATIF - pointage de départ sans arrivée
  const rDepartSansArrivee = await rpc(jetonAgent, 'pointer_depart', {
    target_assignment_id: idAffectation,
    p_rapport: 'rapport premature',
  });
  etape(
    6, 'NEGATIF : pointer son depart sans etre arrive',
    'refuse par la base',
    refuser(rDepartSansArrivee),
    rDepartSansArrivee.statut >= 400,
  );

  // 7. Arrivée
  const rArrivee = await rpc(jetonAgent, 'pointer_arrivee', {
    target_assignment_id: idAffectation,
  });
  const missionApresArrivee = await statutMission(jetonClient, idMission);
  etape(
    7, 'le prestataire pointe son arrivee',
    'mission in_progress',
    missionApresArrivee === 'in_progress'
      ? missionApresArrivee
      : `${missionApresArrivee} / ${erreur(rArrivee)}`,
    missionApresArrivee === 'in_progress',
  );

  // 8. CAS NÉGATIF - clore alors que le prestataire n'est pas parti
  //
  // C'est LA garantie de la migration `20260928002400`. Sans elle, un client
  // pourrait clore sa mission et forcer l'affectation à `completed` alors que
  // l'agent est sur place, et lui retirer le droit de contester.
  const rClotureAvantDepart = await rpc(jetonClient, 'cloturer_mission', {
    target_mission_id: idMission,
  });
  etape(
    8, 'NEGATIF : clore avant le depart du prestataire',
    'refuse : le prestataire n a pas pointe son depart',
    refuser(rClotureAvantDepart),
    rClotureAvantDepart.statut >= 400,
  );

  // 9. Départ, avec le rapport joint
  //
  // `p_rapport` est le DEUXIÈME paramètre de `pointer_depart`. C'est ce que la
  // migration `20260928002200` a décidé : le rapport se rédige au moment du
  // départ, dans le même appel. Demander à l'agent de revenir plus tard pour
  // écrire ce qu'il a constaté serait lui faire faire deux fois le même travail.
  const rDepart = await rpc(jetonAgent, 'pointer_depart', {
    target_assignment_id: idAffectation,
    p_rapport: 'Tout s est bien passe. Portes verifiees, poste ferme.',
  });
  const apresDepart = await statutAffectation(jetonAgent, idAffectation);
  etape(
    9, 'le prestataire pointe son depart et joint son rapport',
    'depart enregistre, rapport present, affectation TOUJOURS accepted',
    apresDepart?.check_out_time
      ? `depart ok, rapport ${apresDepart.report ? 'present' : 'ABSENT'},`
        + ` statut ${apresDepart.status}`
      : erreur(rDepart),
    Boolean(apresDepart?.check_out_time)
      && Boolean(apresDepart.report)
      && apresDepart.status === 'accepted',
  );

  // 10. CAS NÉGATIF - départ répété
  //
  // Un second pointage ne doit pas écraser le premier : un rapport réécrit après
  // coup effacerait la trace de ce qui a été constaté.
  const rDepartBis = await rpc(jetonAgent, 'pointer_depart', {
    target_assignment_id: idAffectation,
    p_rapport: '   ',
  });
  etape(
    10, 'NEGATIF : pointer un second depart',
    'refuse : le pointage ne peut pas etre repete',
    refuser(rDepartBis),
    rDepartBis.statut >= 400,
  );

  // 11. Clôture
  //
  // L'ÉTAPE CORRIGÉE LE 2026-09-28. `complete_mission` ne touchait que la
  // mission : le client voyait « Terminée » et l'affectation restait « Acceptée ».
  const rCloture = await rpc(jetonClient, 'cloturer_mission', {
    target_mission_id: idMission,
  });
  const missionApresCloture = await statutMission(jetonClient, idMission);
  const affectationApresCloture = await statutAffectation(jetonAgent, idAffectation);
  etape(
    11, 'le client cloture la mission',
    'mission completed ET affectation completed',
    `mission ${missionApresCloture}, affectation ${affectationApresCloture?.status}`
      + ` / ${erreur(rCloture)}`,
    missionApresCloture === 'completed'
      && affectationApresCloture?.status === 'completed',
  );

  // 12. CAS NÉGATIF - clôturer deux fois
  const rClotureBis = await rpc(jetonClient, 'cloturer_mission', {
    target_mission_id: idMission,
  });
  etape(
    12, 'NEGATIF : cloturer une mission deja close',
    'refuse par la base',
    refuser(rClotureBis),
    rClotureBis.statut >= 400,
  );

  // 13. Le prestataire voit-il la même conclusion que le client ?
  //
  // C'est la question posée le 2026-09-28 en une phrase : « Terminée » chez le
  // client, « Acceptée » chez le prestataire. Elle est reposée à chaque
  // exécution, pour qu'elle ne puisse pas revenir sans témoin.
  const vueAgent = await statutAffectation(jetonAgent, idAffectation);
  etape(
    13, 'le prestataire voit la meme conclusion que le client',
    'affectation completed',
    vueAgent?.status ?? 'invisible',
    vueAgent?.status === 'completed',
  );
};

main()
  .then(() => {
    const alertes = resultats.filter((r) => !r.ok);
    const ligne = '='.repeat(60);

    console.log(`\n${ligne}`);
    console.log('BILAN');
    console.log(ligne);
    console.log(
      `${resultats.length - alertes.length} / ${resultats.length} etapes conformes.`,
    );

    if (alertes.length > 0) {
      console.log(`\n${alertes.length} ALERTE(S) - un defaut possible :\n`);
      for (const a of alertes) {
        console.log(`  ${a.numero}. ${a.libelle}`);
        console.log(`     attendu : ${a.attendu}`);
        console.log(`     obtenu  : ${a.obtenu}`);
      }
      console.log(
        '\nUne ALERTE n est pas un echec du test : c est un defaut trouve.',
      );
    } else {
      console.log(
        '\nLe parcours a ete joue par deux comptes reels, et les cinq cas',
      );
      console.log('negatifs ont bien ete refuses par la base.');
    }

    console.log(`\nMission du tour : ${titreCourant}`);
    console.log('Elle reste en base : il n existe pas de politique de');
    console.log('suppression cote client, et c est voulu.');
    console.log(`${ligne}\n`);

    process.exit(alertes.length > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error('\nERREUR INATTENDUE\n');
    console.error(e);
    console.error(`\nMission du tour : ${titreCourant}\n`);
    process.exit(1);
  });

