import { supabase } from '@/lib/supabase';
import type { MissionUpdatableFields, TableInsert } from '@/types';

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
  missions: {
    id: string;
    client_id: string;
    title: string;
    address: string;
    city: string;
    start_time: string;
    end_time: string;
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
          address,
          city,
          start_time,
          end_time,
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
          address,
          city,
          start_time,
          end_time,
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
  async createAssignment(
    assignment: Omit<TableInsert<'mission_assignments'>, 'status'>,
  ) {
    const { data, error } = await supabase
      .from('mission_assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;
    return data;
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

  // Check-in
  async checkIn(assignmentId: string, location?: { lat: number; lng: number }) {
    const { data, error } = await supabase
      .from('mission_assignments')
      .update({
        check_in_time: new Date().toISOString(),
        check_in_location_lat: location?.lat,
        check_in_location_lng: location?.lng,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check-out
  async checkOut(assignmentId: string, location?: { lat: number; lng: number }, report?: string) {
    const { data, error } = await supabase
      .from('mission_assignments')
      .update({
        check_out_time: new Date().toISOString(),
        check_out_location_lat: location?.lat,
        check_out_location_lng: location?.lng,
        report,
      })
      .eq('id', assignmentId)
      .select()
      .single();

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
};
