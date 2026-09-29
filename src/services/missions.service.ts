import { supabase } from '@/lib/supabase';
import type {
  AssignmentStatus,
  MissionUpdatableFields,
  TableInsert,
} from '@/types';

type MissionAssignmentWithMission = {
  id: string;
  mission_id: string;
  agent_id: string | null;
  company_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  proposed_rate: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  report: string | null;
  created_at: string;
  updated_at: string;
  /*
   * COLONNES AJOUTÉES LE 2026-09-29 : `description` et `special_requirements`.
   *
   * L'écran d'exécution de mission les affiche, et il ne pouvait pas les lire :
   * la sélection ne les demandait pas. Ce n'est pas un droit manquant — AUCUNE
   * migration n'est nécessaire. `grant select` sur `missions` est accordé AU
   * NIVEAU TABLE, et la ligne s'ouvre par `private.can_view_mission`, qui
   * ouvre la mission à l'agent affecté dès le statut `pending`. Un agent qui lit
   * `title` peut donc lire les consignes du site : la RLS filtre des LIGNES,
   * pas des colonnes.
   */
  missions: {
    id: string;
    client_id: string;
    title: string;
    description: string | null;
    address: string;
    city: string;
    start_time: string;
    end_time: string;
    special_requirements: string | null;
    status:
      | 'draft'
      | 'published'
      | 'accepted'
      | 'in_progress'
      | 'completed'
      | 'cancelled'
      | 'disputed'
      | 'paid';
  } | null;
};

/**
 * Affectation telle que le client propriétaire de la mission peut la lire.
 *
 * COLONNES DE LA TABLE SEULE, SANS IMBRICATION.
 *
 * C'est la contrepartie exacte de ce que la politique
 * « Mission participants can view assignments » autorise : `can_view_assignment`
 * exige un statut `pending`, `accepted` ou `completed`, et que le lecteur soit le
 * client, l'agent ou la société. Une affectation `rejected` n'est donc pas
 * visible du client — et c'est correct : personne n'a à savoir qu'un
 * prestataire a refusé.
 */
export type MissionAssignmentSummary = {
  id: string;
  mission_id: string;
  agent_id: string | null;
  company_id: string | null;
  status: AssignmentStatus;
  proposed_rate: number | null;
  /**
   * Pointages, lisibles par le client comme par l'agent.
   *
   * `grant select` est accordé AU NIVEAU TABLE sur `mission_assignments`, et la
   * politique `can_view_assignment` ouvre la ligne au propriétaire de la
   * mission. Le client voit donc les horaires de vacation de son prestataire —
   * ce qui est précisément l'intérêt d'un suivi.
   */
  check_in_time: string | null;
  check_out_time: string | null;
  report: string | null;
  created_at: string;
};

/**
 * Résout l'identifiant métier (agent_profiles.id ou company_profiles.id)
 * à partir de l'identifiant utilisateur (auth.uid = profiles.id).
 *
 * Ces deux identifiants sont distincts : mission_assignments.agent_id référence
 * agent_profiles.id et mission_assignments.company_id référence company_profiles.id,
 * et non profiles.id. Filtrer directement sur user.id ne retourne donc jamais
 * de résultat.
 */
async function resolveProviderId(
  userId: string,
  kind: 'agent' | 'company',
): Promise<string> {
  const table = kind === 'agent' ? 'agent_profiles' : 'company_profiles';
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      kind === 'agent'
        ? "Aucun profil agent n'est associé à ce compte."
        : "Aucun profil société n'est associé à ce compte.",
    );
  }

  return data.id;
}

export const missionsService = {
  // Créer une mission
  //
  // ⚠️ NE PAS AJOUTER `.select()` — 2026-09-27
  //
  // L'insertion ÉCHOUAIT avec « new row violates row-level security policy ».
  // Ce message était FAUX : l'écriture passait, et c'est sa RELECTURE qui
  // échouait.
  //
  // `.insert().select()` envoie `Prefer: return=representation`. PostgREST
  // insère alors la ligne, puis la RELIT — et cette relecture est soumise à
  // la politique de SELECT de `missions`, donc à `private.can_view_mission()`,
  // un `SECURITY DEFINER` qui interroge `mission_assignments`,
  // `agent_profiles` et `company_profiles`. L'échec de cette fonction
  //interrompt la requête, et PostgREST a renvoyé 403 en donnant l'impression que
  // l'écriture avait été refusée.
  //
  // La preuve, par deux requêtes identiques dont un seul en-tête diffère :
  //
  //     return=minimal         -> 201   l'écriture passe
  //     return=representation  -> 403   la relecture échoue
  //
  // Il a fallu neuf contrôles SQL, tous au vert, et une journée entière pour
  // le voir : ces contrôles mesurent l'ÉTAT de la base, jamais ce que
  // PostgreSQL fait de l'EN-TÊTE de la requête.
  //
  // `.select().single()` est donc retiré. L'appelant n'a pas besoin de la
  // ligne créée : `useCreateMission` invalide la liste, qui la relit
  // ensuite par la politique de SELECT — celle-là fonctionne, elle est
  // utilisée partout.
  async createMission(mission: TableInsert<'missions'>) {
    const { error } = await supabase.from('missions').insert(mission);

    if (error) throw error;
  },

  // Récupérer les missions du client connecté
  async getClientMissions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Récupérer une mission par ID
  async getMissionById(missionId: string) {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour une mission
  //
  // Le type est volontairement plus étroit que `TableUpdate<'missions'>` : il
  // ne décrit que les colonnes que la base accorde au client (voir
  // `MissionUpdatableFields`). `status` passe par `publishMission` /
  // `cancelMission`, et `client_id` n'est pas modifiable.
  async updateMission(missionId: string, updates: MissionUpdatableFields) {
    const { data, error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Publier une mission
  // La transition est validée côté serveur : le client ne peut pas écrire
  // missions.status directement (colonne non accordée par la migration RLS).
  async publishMission(missionId: string) {
    const { data, error } = await supabase.rpc('publish_mission', {
      target_mission_id: missionId,
    });

    if (error) throw error;
    return data;
  },

  // Annuler une mission
  async cancelMission(missionId: string) {
    const { data, error } = await supabase.rpc('cancel_mission', {
      target_mission_id: missionId,
    });

    if (error) throw error;
    return data;
  },

  // Récupérer les missions assignées à un agent
  async getAgentMissions(): Promise<MissionAssignmentWithMission[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const agentId = await resolveProviderId(user.id, 'agent');

    const { data, error } = await supabase
      .from('mission_assignments')
      .select(`
        id,
        mission_id,
        agent_id,
        company_id,
        status,
        proposed_rate,
        check_in_time,
        check_out_time,
        report,
        created_at,
        updated_at,
        missions (
          id,
          client_id,
          title,
          description,
          address,
          city,
          start_time,
          end_time,
          special_requirements,
          status
        )
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MissionAssignmentWithMission[];
  },

  // Récupérer les missions assignées à une société
  async getCompanyMissions(): Promise<MissionAssignmentWithMission[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const companyId = await resolveProviderId(user.id, 'company');

    const { data, error } = await supabase
      .from('mission_assignments')
      .select(`
        id,
        mission_id,
        agent_id,
        company_id,
        status,
        proposed_rate,
        check_in_time,
        check_out_time,
        report,
        created_at,
        updated_at,
        missions (
          id,
          client_id,
          title,
          description,
          address,
          city,
          start_time,
          end_time,
          special_requirements,
          status
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MissionAssignmentWithMission[];
  },

  // Créer une affectation
  //
  // Le type est restreint de la même façon que `updateMission` : la migration
  // `20260925000600` n'accorde que `mission_id`, `agent_id`, `company_id` et
  // `proposed_rate`, et une affectation doit démarrer à `pending`. Un client ne
  // doit pas pouvoir s'écrire `accepted`.
  //
  // `agent_id` et `company_id` restent facultatifs ici, et c'est volontaire :
  // la contrainte `mission_assignments_target_check` impose
  // `num_nonnulls(agent_id, company_id) = 1`, donc exactement UNE des deux
  // colonnes est renseignée. Les rendre toutes deux obligatoires dans le type
  // ferait rejeter à la compilation la forme la plus courante de l'affectation.
  // ⚠️ NE PAS AJOUTER `.select()` — 2026-09-28
  //
  // Motif identique à `createMission` : `.insert().select()` envoie
  // `Prefer: return=representation`. PostgREST insère la ligne, puis la RELIT,
  // et cette relecture passe par « Mission participants can view assignments »
  // donc par `private.can_view_assignment()`, un `SECURITY DEFINER`.
  //
  // ATTENTION : ici, le raisonnement DIT que ça passe. Le client est le
  // propriétaire de la mission (`m.client_id = auth.uid()`) et le statut initial
  // est `pending` — or `can_view_assignment` accepte exactement ces deux cas.
  // C'est ce qui rend le piège si dangereux : sur `missions`, le même
  // raisonnement disait vrai, et l'appel renvoyait 403.
  //
  // La cause de P1 n'a jamais été ÉTABLIE. On ne la suppose donc pas résolue
  // par analogie : on retire le `.select()`, et la preuve viendra du test
  // fonctionnel, pas d'un raisonnement.
  //
  // Aucun appelant n'a besoin de la ligne créée. L'agent affecté la verra
  // apparaître dans la liste, relue par la politique de SELECT — celle-là est
  // utilisée partout et fonctionne. La signature rend donc `void`, comme
  // `createMission`, pour qu'un futur appelant ne compte pas sur une valeur
  // qui n'est plus fournie.
  async createAssignment(
    assignment: Omit<TableInsert<'mission_assignments'>, 'status'>,
  ) {
    const { error } = await supabase
      .from('mission_assignments')
      .insert(assignment);

    if (error) throw error;
  },

  // Accepter une affectation
  // La transition est validée côté serveur : le statut d'affectation n'est pas
  // accessible en écriture depuis le client.
  async acceptAssignment(assignmentId: string) {
    const { data, error } = await supabase.rpc('accept_assignment', {
      target_assignment_id: assignmentId,
    });

    if (error) throw error;
    return data;
  },

  // Refuser une affectation
  async rejectAssignment(assignmentId: string) {
    const { data, error } = await supabase.rpc('reject_assignment', {
      target_assignment_id: assignmentId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Pointer son arrivée.
   *
   * APPELLE `pointer_arrivee`, MIGRATION `20260928002200` — et non un `UPDATE`.
   *
   * Ce n'est pas un détail d'implémentation. L'écriture directe de
   * `check_in_time` était autorisée par la politique, mais elle laissait la
   * mission en `accepted` — et la matrice n'offrait AUCUNE sortie depuis cet
   * état. Le client n'avait donc aucun moyen de terminer sa mission.
   *
   * La fonction écrit l'heure ET fait passer la mission `in_progress` dans la
   * MÊME opération, et refuse l'appel par un agent non affecté.
   *
   * `location` reste accepté sans être exigé : la géolocalisation arrive à
   * l'étape 11, et les colonnes sont déjà accordées et nullables. Ne rien
   * envoyer est exact, pas approximatif.
   */
  async pointerArrivee(assignmentId: string): Promise<void> {
    const { error } = await supabase.rpc('pointer_arrivee', {
      target_assignment_id: assignmentId,
    });

    if (error) throw error;
  },

  /**
   * Pointer son départ et rédiger son rapport.
   *
   * APPELLE `pointer_depart`, migration `20260928002200`.
   *
   * La fonction REFUSE un départ sans arrivée. Cette règle est écrite dans la
   * base, et pas seulement dans l'écran : un écran qui la fait suffirait
   * jusqu'au premier client qui parle au serveur autrement.
   *
   * `rapport` est joint au pointage de sortie : c'est la fin de vacation, et
   * demander à l'agent de revenir plus tard pour écrire ce qu'il a constaté
   * serait lui faire faire deux fois le même travail. La fonction normalise
   * une chaîne de spaces en `NULL` : un rapport vide n'est pas un rapport.
   */
  async pointerDepart(assignmentId: string, rapport?: string): Promise<void> {
    const { error } = await supabase.rpc('pointer_depart', {
      target_assignment_id: assignmentId,
      p_rapport: rapport ?? null,
    });

    if (error) throw error;
  },

  /**
   * Enregistrer le rapport SANS quitter la vacation.
   *
   * ÉCRITURE DIRECTE, ET C'EST LÉGITIME ICI — CONTRAIREMENT AUX STATUTS.
   *
   * `report` fait partie des colonnes accordées :
   *
   *   grant update (check_in_time, check_in_location_lat,
   *                 check_in_location_lng, check_out_time,
   *                 check_out_location_lat, check_out_location_lng, report)
   *
   * et la politique « Assigned agents can update mission reports » n'ouvre la
   * ligne qu'à l'agent affecté. Le contrôle 23 mesure ce droit depuis le
   * 2026-09-28. Ce n'est donc pas une écriture par la porte de derrière : c'est
   * un droit prévu, et le contrôle 23 en exclut explicitement `status`.
   *
   * LE RAPPORT EST NORMALISÉ COMME DANS `pointer_depart` : une chaîne de
   * spaces devient `NULL`. Un rapport vide n'est pas un rapport, et il ne doit
   * pas laisser croire qu'un agent a déposé quelque chose.
   *
   * ⚠️ NE PAS AJOUTER `.select()` — même raison que `createAssignment` et
   * `createMission` : la relecture de la ligne par la politique de SELECT
   * déguise un refus en 403, et rien n'a besoin de la valeur renvoyée.
   */
  async enregistrerRapport(assignmentId: string, rapport: string): Promise<void> {
    const { error } = await supabase
      .from('mission_assignments')
      .update({ report: rapport.trim() === '' ? null : rapport.trim() })
      .eq('id', assignmentId);

    if (error) throw error;
  },

  /**
   * Le client clôt la mission.
   *
   * APPELLE `cloturer_mission`, MIGRATION `20260928002400`.
   *
   * `complete_mission` ne suffisait pas, et le défaut était VISIBLE : le badge
   * de la mission passait à « Terminée » côté client, tandis que l'affectation
   * restait `accepted` — donc l'agent voyait encore « Acceptée » de son côté, et
   * le client aussi sur sa liste.
   *
   * La cause : deux transitions, deux acteurs. `transition_mission` n'écoute
   * que le client, `transition_assignment` que l'agent affecté. Aucun geste
   * unique ne pouvait faire avancer les deux.
   *
   * `cloturer_mission` fait les deux dans la MÊME opération, et REFUSE tant
   * qu'un prestataire n'a pas pointé son départ. C'est cette condition qui
   * protège l'agent : sans elle, un client pourrait forcer une affectation à
   * `completed` alors que l'agent n'est jamais venu, et ne plus contester.
   *
   * L'AGENT NE CLÔTURE JAMAIS LUI-MÊME. Il écrit son rapport et pointe son
   * départ ; le client, seul juge de ce qui a été fait, confirme.
   */
  async cloturerMission(missionId: string) {
    const { data, error } = await supabase.rpc('cloturer_mission', {
      target_mission_id: missionId,
    });

    if (error) throw error;
    return data;
  },

  // Récupérer les affectations d'une mission
  async getMissionAssignments(missionId: string) {
    const { data, error } = await supabase
      .from('mission_assignments')
      .select(`
        *,
        agent_profiles(*, profiles(*)),
        company_profiles(*, profiles(*))
      `)
      .eq('mission_id', missionId);

    if (error) throw error;
    return data;
  },

  /**
   * Affectations d'une mission, pour le client qui la possède.
   *
   * ⚠️ NE PAS IMBRIQUER `agent_profiles(*, profiles(*))` ICI.
   *
   * C'est exactement le motif du défaut du 2026-09-27, et il faut le dire deux
   * fois parce qu'il est tentant : `profiles` n'est pas lisible par un client —
   * la politique « Profiles are viewable by owner or admin » ne l'ouvre qu'à
   * l'intéressé et à l'administrateur.
   *
   * Sur une imbrication, PostgREST n'échoue PAS : il renvoie `null` pour la
   * ressource filtrée. Le résultat est donc une affectation sans nom, sans
   * erreur, sans journal — et l'écran affiche un prestataire fantôme. Un
   * « aucun prestataire trouvé » et un « nom manquant » se ressemblent assez
   * pour qu'on y cherche un problème de données pendant une demi-journée.
   *
   * On ne demande donc que les colonnes de la table. C'est suffisant pour
   * afficher une affectation, et c'est la seule forme qui tienne.
   */
  async listerAffectationsMission(missionId: string) {
    const { data, error } = await supabase
      .from('mission_assignments')
      .select(
        'id, mission_id, agent_id, company_id, status, proposed_rate, check_in_time, check_out_time, report, created_at',
      )
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MissionAssignmentSummary[];
  },
};
