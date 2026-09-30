import { useQuery } from '@tanstack/react-query';

import { administrationService } from '@/services';
import { supabase } from '@/lib/supabase';
import type { MissionStatus } from '@/types';

/** Clé de cache des statistiques de la plateforme. */
export const STATISTIQUES_KEY = ['administration', 'statistiques'] as const;

/** Clé de cache de la file de validation. */
export const DOSSIERS_KEY = ['administration', 'dossiers'] as const;

/** Clé de cache de la liste administrative des missions. */
export const ALL_MISSIONS_KEY = ['administration', 'missions'] as const;

/** Une mission telle que l'administrateur peut la lire. */
export type MissionSupervisee = {
  id: string;
  title: string;
  city: string;
  status: MissionStatus;
  startTime: string;
  endTime: string;
  budget: number | null;
};

/**
 * Toutes les missions de la plateforme, pour le seul rôle administrateur.
 *
 * CE SERVICE EST AUTORISÉ PAR LA RLS EXISTANTE, SANS MIGRATION.
 *
 * La politique « Mission participants can view mission » s'appuie sur
 * `private.can_view_mission`, dont la première condition est
 * `private.is_admin()`. Un administrateur ouvre donc toutes les lignes sans
 * qu'aucune politique n'ait été écrite pour lui. C'est vérifié par lecture de
 * `20260925000200_rls_helpers.sql:35` et `20260925000300_rls_policies.sql:171`.
 *
 * L'ACCÈS EST RESTREINT À CE RÔLE, ET CE N'EST PAS UNE CONVENTION.
 *
 * La RLS filtre des LIGNES, pas des RÔLES : si ce service était appelé depuis
 * l'espace client, la politique le ramènerait à « les missions du client » et
 * l'écran afficherait un résultat partiel sans le signaler. `useMissionsAdmin`
 * est donc un hook d' administration, et `administration.service` l'assume dans
 * son en-tête — mais l'appelant reste responsable de ne pas l'utiliser ailleurs.
 *
 * AUCUNE ÉCRITURE ICI, ET AUCUNE FONCTION DE TRANSITION EST APPELÉE.
 *
 * Les statuts ne changent que par les 11 RPC. Cet écran est une lecture.
 */
export function useMissionsAdmin() {
  return useQuery({
    queryKey: [...ALL_MISSIONS_KEY],
    queryFn: async (): Promise<MissionSupervisee[]> => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, title, city, status, start_time, end_time, budget')
        .order('start_time', { ascending: false });

      /*
       * TOUTE ERREUR EST PROPAGÉE.
       *
       * Une lecture refusée qui vaudrait `[]` afficherait « aucune mission »,
       * ce qui se lit comme un fait. Ici un refus reste un refus, et l'écran
       * affiche un message d'erreur avec un bouton « Réessayer ». Même règle que
       * `administrationService`.
       */
      if (error) throw error;

      return (data ?? []).map((mission) => ({
        id: mission.id,
        title: mission.title,
        city: mission.city,
        status: mission.status as MissionStatus,
        startTime: mission.start_time,
        endTime: mission.end_time,
        budget: mission.budget,
      }));
    },
  });
}

/**
 * Compteurs de la plateforme.
 *
 * `refetchInterval` est Délibérément absent.
 *
 * La maquette porte un « Live polling 2s » et une courbe de charge système : ce
 * sont des mesures d'infrastructure, pas des données métier. Interroger la base
 * toutes les deux secondes pour recompter des missions Mobile d'afficherait une
 * précision de surveillance sur des chiffres qui changent à la publication d'une
 * mission, pas à la seconde. Le rafraîchissement suit donc le geste : au retour
 * sur l'écran.
 */
export function useStatistiquesPlateforme() {
  return useQuery({
    queryKey: STATISTIQUES_KEY,
    queryFn: () => administrationService.getStatistiques(),
  });
}

/**
 * File des dossiers de validation en attente.
 *
 * Requête SÉPARÉE de celle des statistiques, et non regroupée : la file peut
 * échouer — par exemple si la migration qui l'ouvre n'est pas appliquée — sans
 * que les compteurs, eux, disparaissent. Réunies, une seule lecture en échec
 * viderait tout l'écran d'accueil.
 */
export function useDossiersEnAttente() {
  return useQuery({
    queryKey: DOSSIERS_KEY,
    queryFn: () => administrationService.getDossiersEnAttente(),
    retry: 0,
  });
}