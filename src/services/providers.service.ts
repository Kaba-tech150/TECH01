/**
 * Recherche des prestataires de sécurité.
 *
 * DEUX TABLES, UNE SEULE RECHERCHE
 *
 * Un client ne cherche pas « des agents » puis « des sociétés » : il cherche
 * « quelqu'un » capable de tenir la mission. Les deux tables sont donc
 * interrogées puis fusionnées.
 *
 * AUCUNE ÉCRITURE ICI
 *
 * Ce service ne fait que des lectures. C'est délibéré : les lectures sont le
 * seul chemin de données validé de bout en bout dans ce projet, tandis que
 * l'écriture a révélé une anomalie de droits non résolue. On ne construit pas
 * l'étape « réserver » avant que l'écriture soit fiable.
 */
import { supabase } from '@/lib/supabase';
import type {
  AgentProfileInsertableFields,
  AgentProfileUpdatableFields,
  ProviderStatus,
} from '@/types';

/**
 * Un prestataire, vu par un client.
 *
 * Les deux tables n'ont pas les mêmes colonnes, et surtout pas les mêmes
 * métiers : `company_name` n'existe que chez une société, `hourly_rate` et
 * `zone` que chez un agent. L'unification se fait ici, explicitement, plutôt
 * que dans un composant qui drive le SQL.
 *
 * `kind` est le seul champ ajouté : il vient du nom de la table interrogée et
 * ne peut pas être déduit des données, puisque `id` est un UUID distinct dans
 * les deux tables.
 */
export type Prestataire = {
  /** 'agent' | 'company' : d'où vient la ligne. */
  kind: 'agent' | 'company';
  /** Identifiant métier : `agent_profiles.id` ou `company_profiles.id`. */
  id: string;
  /** Identifiant utilisateur : `profiles.id`, égal à `auth.uid()` du lecteur. */
  profileId: string;
  /** Nom affiché : raison sociale pour une société, nom de profil pour un agent. */
  nom: string;
  description: string | null;
  city: string | null;
  postalCode: string | null;
  /** Tarif horaire. `null` pour une société : le modèle ne l'a pas prévu. */
  hourlyRate: string | null;
  /** Zone d'intervention. `null` pour une société. */
  zone: string | null;
  bio: string | null;
  /** Numéro de certification. `null` pour une société. */
  certificationNumber: string | null;
  isAvailable: boolean | null;
  status: ProviderStatus;
};

/** Critères de filtrage acceptés par la recherche. */
export type RechercheCriteres = {
  /** Texte libre : nom, description, bio. */
  recherche?: string;
  /** Ville exacte. */
  city?: string;
  /** Ne garder que les prestataires disponibles. */
  uniquementDisponibles?: boolean;
};


/**
 * Colonnes demandées pour un agent.
 *
 * `profiles!inner(full_name)` — et RIEN D'AUTRE.
 *
 * ERREUR CORRIGÉE LE 2026-09-27 : la version précédente demandait
 * `profiles!inner(full_name, city, postal_code)`. Or `public.profiles` ne
 * possède NI `city` NI `postal_code` : ce sont des colonnes de
 * `company_profiles`, pas du profil utilisateur. PostgREST rejette la requête
 * ENTIÈRE, et l'écran affichait « Recherche impossible » — une erreur, et non
 * une liste vide.
 *
 * CONSÉQUENCE DE CONCEPTION, à connaître : LE SCHÉMA NE MODÉLISE PAS LA VILLE
 * D'UN AGENT. `agent_profiles` ne connaît qu'un `zone` libre, et `profiles`
 * n'a aucune localisation. Un agent n'a donc pas de ville interprétable,
 * seulement une zone de texte, telle qu'il l'a saisie.
 *
 * On ne comble pas ce trou en inventant une colonne : la ville d'un agent
 * reste un texte libre, et le traiter comme tel évite de fabriquer une
 * géographie que personne n'a saisie.
 */
/**
 * Colonnes demandées pour une société.
 *
 * PLUS DE JOINTURE, pour la MÊME raison que les agents : `profiles!inner` ne
 * pouvait pas aboutir pour un client, puisque `profiles` n'est pas lisible.
 *
 * Ce n'est pas une perte : le nom affiché d'une société est `company_name`, qui
 * vit sur `company_profiles` LUI-MÊME. La jointure n'apportait que
 * `full_name`, utilisé uniquement comme repli — et ce repli ne pouvait jamais
 * se déclencher, la jointure écartant la ligne avant.
 *
 * `city` et `postal_code` proviennent aussi de `company_profiles` : la version
 * précédente les demandait aux deux endroits, ce qui est redondant et fait
 * échouer PostgREST dès que l'une des deux tables ne possède pas la colonne.
 */
const COLONNES_COMPANY =
  'id, profile_id, company_name, description, city, postal_code, status';

/**
 * Forme des lignes brutes renvoyées par la fonction `liste_agents_publics`.
 *
 * `full_name` remplace `profiles: unknown` : la jointure a disparu, donc le nom
 * arrive en COLONNE, directement. C'est plus simple, et surtout exact : il n'y a
 * plus de forme à normaliser, donc plus de risque que le nom se perde.
 */
type LigneAgent = {
  id: string;
  profile_id: string;
  full_name: string | null;
  zone: string | null;
  bio: string | null;
  hourly_rate: number | null;
  certification_number: string | null;
  is_available: boolean | null;
  status: ProviderStatus;
};

type LigneCompany = {
  id: string;
  profile_id: string;
  company_name: string;
  description: string | null;
  city: string | null;
  postal_code: string | null;
  status: ProviderStatus;
};


/**
 * Construit la chaîne de filtres PostgREST.
 *
 * `ilike` avec les jokers `%` : la recherche est insensible à la casse, comme
 * toute recherche attendue par un utilisateur.
 *
 * LE TERME N'EST JAMAIS CONCATÉNÉ DANS DU SQL. Il part dans les paramètres de
 * requête, que le client Supabase échappe. Un terme contenant `%`, `_` ou un
 * `'` ne peut donc pas transformer la requête en autre chose.
 *
 * Les jokers sont ajoutés ici et non par l'appelant : un appelant ne doit pas
 * pouvoir oublier `%` et obtenir un `=` accidentel, ni injecter un joker.
 *
 * ⚠️ CETTE FONCTION NE SERT PLUS QU'AUX SOCIÉTÉS.
 *
 * Les agents passent par `liste_agents_publics`, qui reçoit le terme en
 * paramètre et applique le sien. Réunir les deux dans un même mécanisme
 * aurait exigé de dupliquer la recherche en JavaScript, donc de la
 * réimplémenter — et une règle écrite deux fois finit toujours par diverger.
 */
function construireFiltre(criteres: RechercheCriteres, colonneTexte: string): string | null {
  const conditions: string[] = [];
  if (criteres.recherche?.trim()) {
    conditions.push(`${colonneTexte}.ilike.%${criteres.recherche.trim()}%`);
    // `description` est la seule colonne de texte commune pertinente pour une
    // société. On ne filtre pas sur `profiles` : cette table n'est pas lisible
    // par un client, et la colonne n'y est pas accessible.
    if (colonneTexte === 'company_name') {
      conditions.push(`description.ilike.%${criteres.recherche.trim()}%`);
    }
  }

  if (criteres.city) {
    conditions.push(`city.eq.${criteres.city}`);
  }

  return conditions.length > 0 ? conditions.join(',') : null;
}

/**
 * Fiche agent du compte connecté.
 *
 * Les champs sont des chaînes, comme ceux du formulaire : la conversion vers
 * les types de la base (`hourly_rate` est un `numeric`) se fait dans le service,
 * à un seul endroit, plutôt que dans chaque appelant.
 */
export type AgentProfile = {
  id: string;
  profileId: string;
  zone: string;
  bio: string;
  /** Chaîne vide quand le tarif n'est pas renseigné. */
  hourlyRate: string;
  certificationNumber: string;
  isAvailable: boolean;
  status: ProviderStatus;
};

export const providersService = {
  /**
   * Prestataires correspondant aux critères.
   *
   * Deux requêtes sont exécutées EN PARALLÈLE, puis les résultats sont
   * fusionnés. Une seule requête PostgREST ne peut pas lire deux tables de
   * premier niveau : `or()` porte sur les LIGNES d'une table, pas sur l'union
   * de deux tables. La parallélisation évite qu'un client attienne l'une puis
   * l'autre.
   *
   * AUCUN FILTRAGE « statut » APPLIQUÉ ICI.
   *
   * Comme pour les villes, le filtre métier appartient à la base : la RLS et
   * les politiques décident de ce qui est visible. Le client ne doit pas
   * réimplémenter cette règle, sinon l'administrateur verrait un résultat
   * différent du sien pour la même requête.
   *
   * LES AGENTS PASSENT PAR UNE FONCTION, PAS PAR UNE TABLE
   *
   * `agent_profiles` est lue via `liste_agents_publics`, parce que le nom
   * affiché (`full_name`) vit dans `profiles`, table fermée au client. Lire les
   * deux par jointure ne pouvait donc pas aboutir — voir `COLONNES_AGENT`.
   *
   * Les sociétés, elles, sont lues directement : leur nom est `company_name`,
   * sur leur propre table. Aucune fonction n'est nécessaire.
   */
  async search(criteres: RechercheCriteres = {}): Promise<Prestataire[]> {
    const filtreCompany = construireFiltre(criteres, 'company_name');
    const terme = criteres.recherche?.trim() || null;

    // Le filtre s'applique APRÈS `select()`.
    //
    // `select()` renvoie un builder de filtres (`.eq`, `.or`, `.ilike`…), pas
    // une promesse : les appliquer dessus est la seule voie. Avant `select()`,
    // le type disponible n'expose pas `.or`.
    //
    // Deux branches explicites plutôt qu'un ternaire : `.or()` attend un
    // argument non nul, et un filtre calculé ne peut pas le garantir au
    // compilateur.
    const baseCompanies = supabase.from('company_profiles').select(COLONNES_COMPANY);

    // `null` et non `''` : la fonction distingue les deux, et une chaîne vide
    // signify « pas de recherche » autant qu'un `null`. Elle reçoit donc ce que
    // l'utilisateur a réellement saisi, nettoyé.
    const [agents, companies] = await Promise.all([
      supabase.rpc('liste_agents_publics', { p_texte: terme }),
      filtreCompany ? baseCompanies.or(filtreCompany) : baseCompanies,
    ]);

    if (agents.error) throw agents.error;
    if (companies.error) throw companies.error;

    const lignesAgents = (agents.data ?? []) as unknown as LigneAgent[];

    // Filtre de disponibilité, appliqué APRÈS l'appel.
    //
    // `is_available` n'a pas été mis en paramètre de la fonction : c'est un
    // critère d'affichage, pas une règle de sécurité. Le filtrer ici ne peut pas
    // contourner quoi que ce soit — la fonction a DÉJÀ rendu ce qu'elle jugeait
    // visible. Filtrer une liste plus large n'expose rien de plus.
    const agentsVisibles = criteres.uniquementDisponibles
      ? lignesAgents.filter((l) => l.is_available === true)
      : lignesAgents;

    const listeAgents: Prestataire[] = agentsVisibles.map((ligne) => ({
      kind: 'agent',
      id: ligne.id,
      profileId: ligne.profile_id,
      nom: ligne.full_name ?? 'Agent sans nom',
      description: null,
      // Le schéma ne donne pas de ville à un agent : `city` et
      // `postal_code` restent nuls, et seule la `zone` libre est connue.
      city: null,
      postalCode: null,
      hourlyRate: ligne.hourly_rate === null ? null : String(ligne.hourly_rate),
      zone: ligne.zone,
      bio: ligne.bio,
      certificationNumber: ligne.certification_number,
      isAvailable: ligne.is_available,
      status: ligne.status,
    }));

    const listeCompanies: Prestataire[] = (
      (companies.data ?? []) as unknown as LigneCompany[]
    ).map((ligne) => ({
      kind: 'company',
      id: ligne.id,
      profileId: ligne.profile_id,
      // `company_name` est sur la table elle-même : aucun repli n'est nécessaire
      // depuis la disparition de la jointure sur `profiles`.
      nom: ligne.company_name || 'Société sans nom',
      description: ligne.description,
      city: ligne.city,
      postalCode: ligne.postal_code,
      hourlyRate: null,
      zone: null,
      bio: null,
      certificationNumber: null,
      isAvailable: null,
      status: ligne.status,
    }));

    return [...listeAgents, ...listeCompanies];
  },

  /**
   * Fiche agent du compte connecté, ou `null` s'il n'en a pas encore.
   *
   * `maybeSingle()` et non `single()` : l'absence est un état NORMAL — le plus
   * grand nombre des comptes n'ont pas de fiche. `single()` lèverait une erreur
   * au lieu de renvoyer `null`, et l'écran afficherait un échec au lieu d'un
   * formulaire de création.
   *
   * `.eq('profile_id', userId)` explicite plutôt que `.single()` implicite : la
   * colonne porte `unique`, mais l'écrire évite de dépendre de cette contrainte
   * pour lire une seule ligne.
   */
  async getMyAgentProfile(userId: string): Promise<AgentProfile | null> {
    const { data, error } = await supabase
      .from('agent_profiles')
      .select(
        'id, profile_id, bio, hourly_rate, zone, certification_number, is_available, status',
      )
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      zone: (data.zone as string | null) ?? '',
      bio: (data.bio as string | null) ?? '',
      hourlyRate:
        data.hourly_rate === null || data.hourly_rate === undefined
          ? ''
          : String(data.hourly_rate),
      certificationNumber: (data.certification_number as string | null) ?? '',
      isAvailable: (data.is_available as boolean | null) ?? true,
      status: data.status as ProviderStatus,
    };
  },

  /**
   * Crée la fiche agent du compte connecté.
   *
   * NE PAS AJOUTER `.select()` — même raison que `missionsService.createMission`
   * le 2026-09-27 : la relecture passerait par la politique de SELECT, et son
   * échec se déguise en refus d'écriture. On invalide le cache et on relit.
   *
   * Ni `status` ni `company_id` ne sont envoyés : `status` n'est pas dans le
   * `grant insert` de 00300, et la politique exige `status = 'registered'`,
   * valeur que la colonne prend par défaut. Les envoyer produirait un refus
   * dont le message ne dirait pas que le problème est le droit.
   *
   * LE TYPE EST `AgentProfileInsertableFields`, et non `Record<string,
   * unknown>` : ce dernier autorise n'importe quelle colonne, y compris celles
   * que la base refuse. C'est le même principe que `MissionUpdatableFields` : le
   * contrat TypeScript doit reproduire le `grant`, sinon il laisse passer des
   * écritures que le serveur rejettera.
   */
  async createAgentProfile(charge: AgentProfileInsertableFields): Promise<void> {
    const { error } = await supabase.from('agent_profiles').insert(charge);

    if (error) throw error;
  },

  /**
   * Met à jour la fiche agent.
   *
   * Même restriction sur `.select()`, et sur les colonnes : la migration 00300
   * n'accorde `update` que sur `certification_number`, `certification_expiry`,
   * `hourly_rate`, `zone`, `bio` et `is_available`. Ni `id`, ni `status`, ni
   * `profile_id` ne sont modifiables : l'identité et l'état d'accréditation
   * restent hors de portée du prestataire.
   *
   * `AgentProfileUpdatableFields` est plus étroit que
   * `TableUpdate<'agent_profiles'>` : il EXCLUT `profile_id`, que le `grant`
   * n'accorde pas. Le 2026-09-27, ce service acceptait un `TableUpdate` trop
   * large et l'appelant envoyait `profile_id` — la fiche se créait, puis toute
   * modification se faisait refuser avec `permission denied for table
   * agent_profiles`, un message qui désigne la table et tait la colonne.
   */
  async updateAgentProfile(
    agentId: string,
    charge: AgentProfileUpdatableFields,
  ): Promise<void> {
    const { error } = await supabase
      .from('agent_profiles')
      .update(charge)
      .eq('id', agentId);

    if (error) throw error;
  },
};
