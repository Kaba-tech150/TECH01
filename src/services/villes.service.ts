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
   * Villes visibles par l'appelant.
   *
   * AUCUN FILTRAGE CÔTÉ CLIENT — et c'est délibéré.
   *
   * La politique RLS « Villes actives lisibles par tous » porte la règle
   * complète : `using (active or private.is_admin())`. Un utilisateur ordinaire
   * ne voit donc que les villes actives, tandis qu'un administrateur voit aussi
   * les villes désactivées — sur la MÊME requête.
   *
   * Le comportement est entièrement porté par la base, seule source de vérité.
   * Filtrer ici (`where active = true`) dupliquerait la règle et romprait le
   * cas de l'administrateur, qui a besoin de voir les villes désactivées pour
   * vérifier une désactivation sans risquer de la contourner.
   *
   * D'où le nom `listCities`, et non `getActiveCities` : la seconde
   * formulation promettait un filtre actif que le code n'applique pas. Elle
   * avait un jumeau, `getAllCities`, qui exécutait la requête identique — deux
   * noms pour un seul comportement. Aucun appelant n'utilisait l'un ou l'autre.
   */
  async listCities(): Promise<Ville[]> {
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