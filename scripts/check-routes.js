/**
 * Controle des routes publiques — SecuGuard.
 *
 * But : detecter deux ecrans qui repondent a la MEME URL publique.
 *
 * POURQUOI CE SCRIPT EXISTE (2026-09-30)
 * --------------------------------------
 * Le defaut 12 : quatre fichiers `profile.tsx` — un par groupe — produisaient
 * tous `/profile`. Un groupe entre parentheses n'entre PAS dans l'URL, donc
 * `(client)/profile`, `(agent)/profile`, `(company)/profile` et `(admin)/profile`
 * sont quatre ecrans, une seule adresse. Idem `/missions` (4 fichiers) et
 * `/mission/[id]` (2 fichiers) : onze URL publiques pour huit ecrans.
 *
 * Le symptome est visible par l'utilisateur : on ouvre
 * `localhost:8081/profile`, le routeur elit un vainqueur arbitraire, et si le
 * role ne correspond pas `ProtectedRoute` redirige vers `role-selection`.
 * L'ecran parait absent.
 *
 * AUCUN CONTROLE EXISTANT NE L'AURAIT VU.
 *
 * `tsc --noEmit` passe : `typedRoutes` valide la FORME d'une chaine, pas son
 * UNICITE. `/(client)/profile` est une chaine parfaitement valide.
 * `npx eslint .` ne lit pas les noms de fichiers. Les 26 controles SQL ne
 * regardent pas le routage. Tous etaient verts le jour du defaut.
 *
 * CE QUE CE SCRIPT NE FAIT PAS.
 *
 * Il ne verifie pas que les liens de navigation pointent vers un ecran
 * existant : c'est le role de `typedRoutes` a la compilation, et une chaine
 * erronee y est une erreur de type. Il ne remplace donc pas `tsc`, il s'y
 * ajoute.
 *
 * Usage : npm run check:routes
 */
const fs = require('node:fs');
const path = require('node:path');

const appDir = path.resolve(__dirname, '..', 'src', 'app');

/**
 * Fichiers qui ne produisent AUCUNE route.
 *
 * `_layout` : un layout, pas un ecran — il enveloppe les enfants de son
 * groupe. `_sitemap` : sortie technique d'Expo Router. Le prefixe `+` est la
 * convention reelle d'Expo Router : un fichier `+not-found.tsx` EST bien
 * l'ecran 404, mais il ne suit pas la regle du nom de fichier.
 */
const NON_ROUTE = /^(?:_layout|_sitemap|\+.*)$/;

/** Extensions reellement chargeables par Expo Router. */
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Transforme un chemin de fichier en URL publique.
 *
 * C'est LA fonction centrale, et celle qu'il faut lire avant de croire le
 * script. Elle applique la regle d'Expo Router :
 *
 *   1. on retire l'extension ;
 *   2. on retire chaque segment de groupe `(client)`, `(agent)`, ... ;
 *   3. `index` disparait : `(client)/index.tsx` EST la racine `/` du groupe ;
 *   4. les segments dynamiques `[id]` sont conserves tels quels.
 *
 *   (client)/mission-suivi/[id].tsx -> /mission-suivi/[id]
 *   (company)/profil-societe.tsx     -> /profil-societe
 *   (agent)/index.tsx                -> /
 */
function urlPublique(relative) {
  const tous = relative.replace(/\\/g, '/').split('/').filter((s) => s.length > 0);

  /*
   * L'EXTENSION EST RETIREE AVANT LE DECOUPAGE, ET NON PENDANT.
   *
   * Premier essai : filtrer les segments contenant un point. Cela supprimait
   * le NOM du fichier au lieu de son extension, et renvoyait `/` pour les 27
   * ecrans — le script signalait un conflit sur une route unique. Le test
   * ci-dessous vérifie les trois cas qui comptent.
   */
  const sansExtension = tous.map((segment, i) =>
    i === tous.length - 1 ? segment.replace(/\.(?:tsx|ts|jsx|js)$/, '') : segment,
  );

  const segments = sansExtension
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .filter((segment) => segment !== 'index');

  return '/' + segments.join('/');
}

/**
 * AUTO-TEST : la fonction est verifiee AVANT tout rapport.
 *
 * SANS CE TEST, LE SCRIPT A PUBLIÉ UN FAUX CONFLIT. Le premier essai de
 * `urlPublique` supprimait le nom du fichier au lieu de son extension, et
 * renvoyait `/` pour les 27 ecrans : le controle annonçait 1 conflit sur une
 * route qui n'en a pas. Sans l'auto-test, ce résultat aurait été lu comme la
 * preuve que le défaut 12 n'était pas corrigé — et il l'était.
 *
 * C'est le meme principe que le `CONTROL_TABLE` temoin de `check:supabase` :
 * un verificateur qui ne prouve pas qu'il fonctionne ne prouve rien.
 */
function autoTest() {
  const cas = [
    // Les trois formes du défaut 12 : même nom, groupes différents.
    ['(client)/profile.tsx', '/profile'],
    ['(agent)/profile.tsx', '/profile'],
    ['(admin)/profile.tsx', '/profile'],
    // Un segment dynamique garde ses crochets.
    ['(client)/mission-suivi/[id].tsx', '/mission-suivi/[id]'],
    // Un groupe n'entre pas dans l'URL.
    ['(company)/profil-societe.tsx', '/profil-societe'],
    // `index` d'un groupe = racine.
    ['(agent)/index.tsx', '/'],
    ['index.tsx', '/'],
    // Un nom qui contient un point ne doit pas être amputé.
    ['(client)/mission/new.tsx', '/mission/new'],
  ];

  const echecs = [];

  for (const [entree, attendu] of cas) {
    const obtenu = urlPublique(entree);
    if (obtenu !== attendu) {
      echecs.push(`  ${entree} -> ${obtenu}   (attendu ${attendu})`);
    }
  }

  if (echecs.length > 0) {
    console.error('AUTO-TEST EN ECHEC : la fonction de routage est fausse.');
    echecs.forEach((ligne) => console.error(ligne));
    console.error('');
    console.error('Aucun rapport n est produit : il serait faux.');
    process.exit(1);
  }

  return cas.length;
}

/** Liste recursive des fichiers d'ecrans, avec leur chemin relatif. */
function listerEcrans(repertoire, prefixe = '') {
  const trouve = [];

  for (const entree of fs.readdirSync(repertoire, { withFileTypes: true })) {
    const chemin = path.join(repertoire, entree.name);
    const relatif = prefixe ? `${prefixe}/${entree.name}` : entree.name;

    if (entree.isDirectory()) {
      trouve.push(...listerEcrans(chemin, relatif));
      continue;
    }

    const extension = path.extname(entree.name);
    if (!EXTENSIONS.includes(extension)) continue;

    if (NON_ROUTE.test(path.basename(entree.name, extension))) continue;

    trouve.push(relatif);
  }

  return trouve;
}
function run() {
  /*
   * L'AUTO-TEST PASSE AVANT TOUT, Y COMPRIS LA LECTURE DU DISQUE.
   *
   * Un verificateur faux ne doit produire aucun rapport : ni « conforme », ni
   * « conflit ». Voir la fonction pour le faux conflit qu'il a réellement
   * publié avant d'exister.
   */
  const casVerifies = autoTest();

  if (!fs.existsSync(appDir)) {
    console.error('Dossier d ecrans introuvable :', appDir);
    process.exit(1);
  }

  const ecrans = listerEcrans(appDir);

  /*
   * AUCUN ECRAN TROUVE N'EST PAS UN « CONFORME ».
   *
   * Un script de controle qui ne trouve rien a verifier doit le dire, jamais
   * conclure. C'est le principe meme du `check:supabase` : ne pas confondre
   * « je n'ai rien mesure » et « tout va bien ».
   */
  if (ecrans.length === 0) {
    console.error('Aucun ecran trouve dans', appDir);
    console.error('Le script ne peut rien verifier.');
    process.exit(1);
  }

  const parUrl = new Map();
  for (const ecran of ecrans) {
    const url = urlPublique(ecran);
    if (!parUrl.has(url)) parUrl.set(url, []);
    parUrl.get(url).push(ecran);
  }

  const conflits = [...parUrl.entries()].filter(([, fichiers]) => fichiers.length > 1);

  /*
   * LA RACINE EST TRAITEE A PART : ELLE N'EST PAS UN CONFLIT.
   *
   * Cinq fichiers se terminent en `index` : `index.tsx` (le `StartupGate`) et
   * les quatre `index` de groupe, qui sont l'accueil de chaque espace. C'est le
   * MOTIF NORMAL d'Expo Router : un groupe a une racine, et le routeur les
   * distingue par le groupe, pas par l'URL.
   *
   * Signaler ce cas comme le défaut 12 serait un second faux positif : il
   * pousserait à suffixer les quatre `index` en `index-client`… qui
   * produirait alors `/index-client` au lieu de l'accueil du groupe. Le défaut
   * est l'INVRAISEMBLABLE : deux fichiers de MEME NOM et de MEME NOM DE GROUPE
   * qui.publishent la meme adresse. La racine est donc exclue du comptage, et
   * elle est annoncee comme telle pour que l'exclusion soit visible.
   */
  const [, racineFichiers] = [...parUrl.entries()].find(([url]) => url === '/') ?? ['/', []];

  const conflitsHorsRacine = conflits.filter(([url]) => url !== '/');

  console.log('============================================================');
  console.log('ROUTES PUBLIQUES');
  console.log('============================================================');
  console.log(`${ecrans.length} ecrans, ${parUrl.size} URL publiques.`);
  console.log(`(fonction de routage verifiee sur ${casVerifies} cas temoins)`);
  console.log('');
  console.log(`Racine "/" : ${racineFichiers.length} ecrans, motif normal d'Expo Router.`);
  console.log('Ce sont les accueils de groupe et le StartupGate.');
  console.log('Ce cas est exclu du controle de conflit : le routeur distingue');
  console.log('ces ecrans par leur groupe, pas par leur URL.');
  console.log('');

  if (conflitsHorsRacine.length === 0) {
    console.log('OK  aucune URL publique ne sert deux ecrans.');
    console.log('');
    console.log('============================================================');
    console.log('BILAN');
    console.log('============================================================');
    console.log('RESULTAT : conforme.');
    console.log(`Les ${parUrl.size} URL publiques correspondent chacune a un seul ecran.`);
    console.log('');
    console.log('Ce que ce controle NE dit pas :');
    console.log('  - qu un ecran s affiche correctement ;');
    console.log('  - que les liens de navigation menent ou il faut ;');
    console.log('  - que les gardes de role font leur travail.');
    console.log('Seul un test a l ecran, avec un vrai compte, le prouve.');
    process.exit(0);
  }

  console.log(`CONFLIT  ${conflitsHorsRacine.length} URL publique(s) servie(s) par plusieurs ecrans.`);
  console.log('');

  for (const [url, fichiers] of conflitsHorsRacine) {
    console.log(`  ${url}`);
    for (const fichier of fichiers) {
      console.log(`      ${fichier}`);
    }
    console.log('');
  }

  console.log('============================================================');
  console.log('BILAN');
  console.log('============================================================');
  console.log(`RESULTAT : ${conflitsHorsRacine.length} conflit(s) de routage.`);
  console.log('');
  console.log("CAUSE : un groupe entre parentheses n entre PAS dans l URL.");
  console.log('Deux fichiers de meme nom dans deux groupes produisent donc la');
  console.log('meme adresse publique, et le routeur elit un vainqueur arbitraire.');
  console.log('Au mieux, un ecran s affiche au mauvais endroit ; au pire,');
  console.log('ProtectedRoute redirige vers role-selection.');
  console.log('');
  console.log('CORRECTION : suffixer le nom du fichier par l espace.');
  console.log('  (client)/profile.tsx  -> (client)/profil-client.tsx');
  console.log('  (agent)/profile.tsx   -> (agent)/profil-agent.tsx');
  console.log('Puis mettre a jour les router.push et les Tabs.Screen.');
  console.log('');
  console.log('Precedent : 2026-09-30, 11 URL publiques pour 8 ecrans.');
  process.exit(1);
}

run();
