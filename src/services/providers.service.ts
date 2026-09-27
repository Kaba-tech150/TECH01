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
import type { ProviderStatus } from '@/types';

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


/** Colonnes demandées pour un agent. */
const COLONNES_AGENT =
  'id, profile_id, bio, hourly_rate, zone, certification_number, is_available, status, profiles!inner(full_name, city, postal_code)';

/** Colonnes demandées pour une société. */
const COLONNES_COMPANY =
  'id, profile_id, company_name, description, city, postal_code, status, profiles!inner(full_name, city, postal_code)';

/**
 * Forme des lignes brutes renvoyées par PostgREST.
 *
 * Elle est déclarée explicitement plutôt que laissée en `any` : le `select`
 * avec jointure renvoie un objet dont le type exact est difficile à écrire,
 * mais `unknown` + une garde reste honnête, là où `any` désactive le contrôle
 * de type sur tout le fichier.
 */
type LigneAgent = {
  id: string;
  profile_id: string;
  bio: string | null;
  hourly_rate: number | null;
  zone: string | null;
  certification_number: string | null;
  is_available: boolean | null;
  status: ProviderStatus;
  profiles: unknown;
};

type LigneCompany = {
  id: string;
  profile_id: string;
  company_name: string;
  description: string | null;
  city: string | null;
  postal_code: string | null;
  status: ProviderStatus;
  profiles: unknown;
};

/**
 * Extrait le profil joint d'une ligne.
 *
 * PostgREST renvoie une jointure many-to-one soit comme un objet, soit comme un
 * tableau selon la relation déduite. Les deux formes sont normalisées ici, une
 * seule fois, plutôt qu'à chaque appelant.
 */
function lireProfil(joined: unknown): {
  full_name: string | null;
  city: string | null;
  postal_code: string | null;
} {
  const vide = { full_name: null, city: null, postal_code: null };
  if (joined === null || typeof joined !== 'object') return vide;

  const candidat = Array.isArray(joined) ? joined[0] : joined;
  if (candidat === null || typeof candidat !== 'object') return vide;

  const p = candidat as Record<string, unknown>;
  return {
    full_name: typeof p.full_name === 'string' ? p.full_name : null,
    city: typeof p.city === 'string' ? p.city : null,
    postal_code: typeof p.postal_code === 'string' ? p.postal_code : null,
  };
}


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
 */
function construireFiltre(criteres: RechercheCriteres, colonneTexte: string): string | null {
  const conditions: string[] = [];
  const terme = criteres.recherche?.trim();

  if (terme) {
    conditions.push(`${colonneTexte}.ilike.%${terme}%`);
    // `bio` n'existe que chez un agent, `description` que chez une société.
    // On ne filtre donc que sur des colonnes communes aux deux tables : sinon
    // PostgREST répond « colonne inconnue » et la recherche entière échoue.
    if (colonneTexte === 'company_name') {
      conditions.push(`description.ilike.%${terme}%`);
    } else {
      conditions.push(`bio.ilike.%${terme}%`);
    }
  }

  if (criteres.city) {
    conditions.push(`city.eq.${criteres.city}`);
  }

  if (criteres.uniquementDisponibles) {
    conditions.push('is_available.eq.true');
  }

  return conditions.length > 0 ? conditions.join(',') : null;
}

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
   */
  async search(criteres: RechercheCriteres = {}): Promise<Prestataire[]> {
    const filtreAgent = construireFiltre(criteres, 'profiles.full_name');
    const filtreCompany = construireFiltre(criteres, 'company_name');

    // Le filtre s'applique APRÈS `select()`.
    //
    // `select()` renvoie un builder de filtres (`.eq`, `.or`, `.ilike`…), pas
    // une promesse : les appliquer dessus est la seule voie. Avant `select()`,
    // le type disponible n'expose pas `.or`.
    //
    // Deux branches explicites plutôt qu'un ternaire : `.or()` attend un
    // argument non nul, et un filtre calculé ne peut pas le garantir au
    // compilateur.
    const baseAgents = supabase.from('agent_profiles').select(COLONNES_AGENT);
    const baseCompanies = supabase.from('company_profiles').select(COLONNES_COMPANY);

    const [agents, companies] = await Promise.all([
      filtreAgent ? baseAgents.or(filtreAgent) : baseAgents,
      filtreCompany ? baseCompanies.or(filtreCompany) : baseCompanies,
    ]);

    if (agents.error) throw agents.error;
    if (companies.error) throw companies.error;

    const listeAgents: Prestataire[] = ((agents.data ?? []) as unknown as LigneAgent[]).map(
      (ligne) => {
        const profil = lireProfil(ligne.profiles);
        return {
          kind: 'agent',
          id: ligne.id,
          profileId: ligne.profile_id,
          nom: profil.full_name ?? 'Agent sans nom',
          description: null,
          city: profil.city,
          postalCode: profil.postal_code,
          hourlyRate: ligne.hourly_rate === null ? null : String(ligne.hourly_rate),
          zone: ligne.zone,
          bio: ligne.bio,
          certificationNumber: ligne.certification_number,
          isAvailable: ligne.is_available,
          status: ligne.status,
        };
      },
    );

    const listeCompanies: Prestataire[] = (
      (companies.data ?? []) as unknown as LigneCompany[]
    ).map((ligne) => {
      const profil = lireProfil(ligne.profiles);
      return {
        kind: 'company',
        id: ligne.id,
        profileId: ligne.profile_id,
        nom: ligne.company_name || profil.full_name || 'Société sans nom',
        description: ligne.description,
        city: ligne.city,
        postalCode: ligne.postal_code,
        hourlyRate: null,
        zone: null,
        bio: null,
        certificationNumber: null,
        isAvailable: null,
        status: ligne.status,
      };
    });

    return [...listeAgents, ...listeCompanies];
  },
};
