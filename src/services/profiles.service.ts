import { supabase } from '@/lib/supabase';
import type { TableInsert, TableUpdate } from '@/types';

type AgentProfileInsert = Omit<TableInsert<'agent_profiles'>, 'profile_id'>;
type CompanyProfileInsert = Omit<TableInsert<'company_profiles'>, 'profile_id'>;

export const profilesService = {
  // Récupérer le profil de l'utilisateur connecté
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour le profil
  async updateProfile(profileId: string, updates: TableUpdate<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer le profil agent
  async getAgentProfile(profileId: string) {
    const { data, error } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) throw error;
    return data;
  },

  // Créer un profil agent
  async createAgentProfile(profileId: string, agentData: AgentProfileInsert) {
    const { data, error } = await supabase
      .from('agent_profiles')
      .insert({ profile_id: profileId, ...agentData })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour le profil agent
  async updateAgentProfile(id: string, updates: TableUpdate<'agent_profiles'>) {
    const { data, error } = await supabase
      .from('agent_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer le profil société
  async getCompanyProfile(profileId: string) {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) throw error;
    return data;
  },

  // Créer un profil société
  async createCompanyProfile(profileId: string, companyData: CompanyProfileInsert) {
    const { data, error } = await supabase
      .from('company_profiles')
      .insert({ profile_id: profileId, ...companyData })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour le profil société
  async updateCompanyProfile(id: string, updates: TableUpdate<'company_profiles'>) {
    const { data, error } = await supabase
      .from('company_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Rechercher des agents disponibles
  async searchAvailableAgents(zone?: string) {
    let query = supabase
      .from('agent_profiles')
      .select(`
        *,
        profiles!inner(id, full_name, avatar_url, phone)
      `)
      .eq('is_available', true)
      .eq('status', 'active');

    if (zone) {
      query = query.eq('zone', zone);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Rechercher des sociétés actives
  async searchActiveCompanies() {
    const { data, error } = await supabase
      .from('company_profiles')
      .select(`
        *,
        profiles!inner(id, full_name, avatar_url, phone)
      `)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  },
};
