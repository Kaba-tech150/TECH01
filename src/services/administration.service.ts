/**
 * Compteurs de la plateforme et file de validation, lisibles par un
 * administrateur.
 *
 * CE SERVICE NE PRODUIT QUE DES AGRÉGATS ET DES LISTES DE DOSSIERS, ET C'EST
 * UN CHOIX.
 *
 * La maquette de l'accueil administrateur est un tableau de bord de supervision :
 * « 142 missions en direct », « 528 agents connectés », « 1 325 inscrits ». Aucun
 * de ces chiffres n'existe en base sous forme d'agrégat : tous se recomptent. Le
 * service les calcule donc en comptant des lignes réellement lisibles, et
 * l'écran affiche le total obtenu.
 *
 * AUCUNE ÉCRITURE, ET AUCUN ACCÈS LARGE : l'administrateur voit les dossiers
 * qu'il doit traiter, pas la base entière. `documents` n'est pas listée — seule
 * comptée — parce qu'elle contient des pièces justificatives dont le contenu
 * n'a pas à figurer sur un écran d'accueil.
 */
import { supabase } from '@/lib/supabase';
import type { ProviderStatus } from '@/types';

/** Un dossier de validation en attente de décision. */
export type DossierValidation = {
  id: string;
  kind: 'agent' | 'company';
  nom: string;
  /** Référence réglementaire saisie par le prestataire : matricule, SIRET. */
  reference: string | null;
  status: ProviderStatus;
  createdAt: string;
};

/** Compteurs de l'accueil administrateur, tous dérivés d'une lecture réelle. */
export type StatistiquesPlateforme = {
  missionsTotal: number;
  /** Missions publiées, acceptées ou en cours : ce qui occupe la plateforme. */
  missionsOuvertes: number;
  agentsTotal: number;
  agentsDisponibles: number;
  societesTotal: number;
  clientsTotal: number;
  /** Dossiers de documents en cours d'examen. */
  documentsEnValidation: number;
};

/** Les statuts qui signifient « la prestation est ouverte ou a commencé ». */
const MISSIONS_OUVERTES = ['published', 'accepted', 'in_progress'] as const;

/** Les statuts d'un dossier qui attendent encore une décision. */
const DOSSIERS_EN_ATTENTE = ['registered', 'documents_submitted', 'in_validation'] as const;

export const administrationService = {
  /**
   * Compteurs de la plateforme.
   *
   * `count: 'exact'` avec `head: true` : PostgREST ne renvoie alors que
   * l'en-tête `Content-Range`, pas les lignes. C'est la seule forme qui compte
   * sans télécharger ce qu'elle n'affichera pas.
   *
   * Les requêtes partent en parallèle : elles sont indépendantes, et l'attente
   * de l'écran est celle de la plus lente, non leur somme.
   *
   * TOUTE ERREUR EST PROPAGÉE, AUCUNE IGNORÉE.
   *
   * Une requête refusée qui vaudrait `null` produirait un « 0 » à l'écran — et
   * « 0 agents connectés » se lit comme un fait. Ici, un refus signifie
   * « je ne sais pas », et l'écran doit pouvoir le dire. L'erreur est donc
   * remontée pour être journalisée et traduite, comme partout ailleurs.
   */
  async getStatistiques(): Promise<StatistiquesPlateforme> {
    const requetes = await Promise.all([
      supabase.from('missions').select('id', { count: 'exact', head: true }),
      supabase
        .from('missions')
        .select('id', { count: 'exact', head: true })
        .in('status', [...MISSIONS_OUVERTES]),
      supabase.from('agent_profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('agent_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true),
      supabase.from('company_profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'client'),
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_validation'),
    ]);

    const [missions, missionsOuvertes, agents, agentsDisponibles, societes, clients, documents] =
      requetes;

    for (const requete of requetes) {
      if (requete.error) throw requete.error;
    }

    return {
      missionsTotal: missions.count ?? 0,
      missionsOuvertes: missionsOuvertes.count ?? 0,
      agentsTotal: agents.count ?? 0,
      agentsDisponibles: agentsDisponibles.count ?? 0,
      societesTotal: societes.count ?? 0,
      clientsTotal: clients.count ?? 0,
      documentsEnValidation: documents.count ?? 0,
    };
  },
  /**
   * Dossiers de validation en attente, les plus récents d'abord.
   *
   * Agents et sociétés sont lus SÉPARÉMENT puis fusionnés, et non par une requête
   * conditionnée sur un rôle. Pour l'administrateur, un dossier de société et un
   * dossier d'agent sont le même travail : la file doit être une seule file.
   *
   * `limit` borne chaque lecture à la taille de l'aperçu affiché ; la file
   * complète est l'écran suivant, qui a sa propre requête.
   */
  async getDossiersEnAttente(limite = 6): Promise<DossierValidation[]> {
    const [agents, societes] = await Promise.all([
      supabase
        .from('agent_profiles')
        .select('id, certification_number, status, created_at')
        .in('status', [...DOSSIERS_EN_ATTENTE])
        .order('created_at', { ascending: false })
        .limit(limite),
      supabase
        .from('company_profiles')
        .select('id, company_name, siret, status, created_at')
        .in('status', [...DOSSIERS_EN_ATTENTE])
        .order('created_at', { ascending: false })
        .limit(limite),
    ]);

    if (agents.error) throw agents.error;
    if (societes.error) throw societes.error;

    const dossiers: DossierValidation[] = [];

    for (const agent of agents.data) {
      dossiers.push({
        id: agent.id,
        kind: 'agent',
        /*
         * `agent_profiles` NE PORTE PAS DE NOM.
         *
         * La table n'a que des qualifications : zone, tarif, certification. Le
         * nom du titulaire est dans `profiles`, que l'administrateur peut lire
         * mais que cette liste n'imbrique pas — mélanger deux tables dans une
         * file déjà triée par date n'apporte rien et élargit la surface lue.
         * L'identifiant court est donc affiché ; l'écran complet, qui nomme les
         * personnes, est la route suivante.
         */
        nom: `Agent · ${String(agent.id).slice(0, 8)}`,
        reference: agent.certification_number,
        status: agent.status as ProviderStatus,
        createdAt: agent.created_at,
      });
    }

    for (const societe of societes.data) {
      dossiers.push({
        id: societe.id,
        kind: 'company',
        nom: societe.company_name,
        reference: societe.siret,
        status: societe.status as ProviderStatus,
        createdAt: societe.created_at,
      });
    }

    dossiers.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return dossiers.slice(0, limite);
  },
};


