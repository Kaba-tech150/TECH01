import { supabase } from '@/lib/supabase';
import type { TableInsert, TableUpdate, Ville } from '@/types';

/**
 * Référentiel des villes desservies.
 *
 * La liste est fermée et administrée : la zone de couverture de
 * l'application grandit progressivement, et une ville ne doit être proposée
 * que lorsqu'il existe réellement quelqu'un pour la desservir.
 *
 * C'est un service distinct de `profilesService` : ce n'est pas une donnée
 * d'utilisateur, et son cycle de vie n'a aucun rapport avec un compte.
 */
export const villesService = {
  /**
   * Villes actuellement desservies, triées par nom.
   *
   * Aucune ville n'est filtrée côté client : la politique RLS
   * « Villes actives lisibles par tous » s'en charge, et elle est la seule
   * source de vérité. Filtrer ici dupliquerait la règle et risquerait de
   * diverger.
   */
  async getActiveCities(): Promise<Ville[]> {
    const { data, error } = await supabase
      .from('villes')
      .select('id, nom, code_postal, region, active, created_at, updated_at')
      .order('nom');

    if (error) throw error;
    return data;
  },

  /**
   * Toutes les villes, y compris désactivées.
   *
   * Réservé à l'administration : c'est la seule requête qui remonte une ville
   * inactive, et la politique RLS ne l'accorde qu'à un administrateur.
   */
  async getAllCities(): Promise<Ville[]> {
    const { data, error } = await supabase
      .from('villes')
      .select('id, nom, code_postal, region, active, created_at, updated_at')
      .order('nom');

    if (error) throw error;
    return data;
  },

  /** Ouvre une nouvelle ville. Refusé par la RLS si l'appelant n'est pas administrateur. */
  async createCity(ville: TableInsert<'villes'>) {
    const { data, error } = await supabase
      .from('villes')
      .insert(ville)
      .select('id, nom, code_postal, region, active, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Modifie une ville.
   *
   * `active: false` retire la ville des sélections sans la supprimer : les
   * missions déjà créées restent lisibles et leur libellé ne change pas.
   */
  async updateCity(id: string, updates: TableUpdate<'villes'>) {
    const { data, error } = await supabase
      .from('villes')
      .update(updates)
      .eq('id', id)
      .select('id, nom, code_postal, region, active, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },
};