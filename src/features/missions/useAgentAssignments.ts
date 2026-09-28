import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { missionsService } from '@/services';
// Import DIRECT, jamais par le baril : `./useMissions` réexporte ce fichier via
// `./index`, et le passer par le baril refermerait le cycle — le défaut S8.
import { CLIENT_MISSIONS_KEY } from './useMissions';

/**
 * Clé de cache des affectations de l'agent connecté.
 *
 * Distincte de `assignmentsKey(missionId)`, qui est celle du CLIENT. Les deux
 * portent pourtant le même préfixe : c'est volontaire, pour qu'une invalidation
 * large — par exemple après une action du client — ne puisse pas les confondre,
 * et qu'aucune ne puisse afficher les données de l'autre.
 */
export const AGENT_ASSIGNMENTS_KEY = ['assignments', 'agent'] as const;

/**
 * Affectations reçues par l'agent connecté.
 *
 * ⚠️ CETTE LECTURE INTERROGE `missions` PAR IMBRICATION, ET C'EST LE PREMIER
 * ENDROIT OÙ ELLE EST LÉGITIME.
 *
 * Le défaut du 2026-09-27 portait sur une imbrication de `profiles` — table que
 * le client ne peut pas lire, et dont il demandait des colonnes inexistantes.
 * Ici, l'agent **peut** legitimately lire la mission : `can_view_mission` lui
 * ouvre celle à laquelle il est affecté, dès le statut `pending`.
 *
 * La différence n'est pas de forme, elle est de DROIT. Une imbrication est
 * licite quand la ligne visée est lisible par le lecteur. Celle-ci l'est, et
 * celle du 27/09 ne l'était pas.
 *
 * Elle reste non exécutée : c'est le premier vrai test de ce chemin.
 */
export function useMesAffectations() {
  return useQuery({
    queryKey: AGENT_ASSIGNMENTS_KEY,
    queryFn: () => missionsService.getAgentMissions(),
  });
}

/** Ce qu'un agent répond à une demande. */
export type ReponseAffectation = 'accepter' | 'refuser';

/** Arrivée ou départ. */
export type Pointage = 'arrivee' | 'depart';

/**
 * Pointer une arrivée ou un départ, et rédiger le rapport.
 *
 * `is_assignment_agent` exige le statut `accepted` ou `completed` : pointer
 * avant d'avoir accepté est REFUSÉ par la base. L'écran ne propose donc le
 * bouton que sur une affectation acceptée — un bouton qui échoue est pire
 * qu'un bouton absent.
 *
 * La géolocalisation arrive à l'étape 11. Les colonnes sont déjà accordées et
 * nullables : ne rien envoyer est exact, pas approximatif.
 */
export function usePointerAffectation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      affectationId,
      pointage,
      rapport,
    }: {
      affectationId: string;
      pointage: Pointage;
      rapport?: string;
    }) =>
      pointage === 'arrivee'
        ? missionsService.pointerArrivee(affectationId)
        : missionsService.pointerDepart(affectationId, rapport),

    onSuccess: () => {
      /*
       * LES DEUX LISTES SONT INVALIDÉES, ET LE SECOND EFFET EST LE PLUS UTILE.
       *
       * Pointer l'arrivée fait passer la mission `accepted` → `in_progress`.
       * Or la liste de l'agent imbrique `missions(...)` : sans cette
       * invalidation, l'écran afficherait encore « Acceptée » alors que la
       * mission a démarré. C'est l'agent qui voit l'effet de son propre geste,
       * donc c'est le premier écran à se rafraîchir.
       */
      void queryClient.invalidateQueries({ queryKey: AGENT_ASSIGNMENTS_KEY });
    },
  });
}

/**
 * Clôturer la mission, côté client.
 *
 * UN SEUL GESTE POUR DEUX STATUTS.
 *
 * `cloturer_mission` fait passer la mission ET ses affectations à `completed`
 * dans la même opération. Avant elle, `complete_mission` ne touchait que la
 * mission : le client voyait « Terminée » sur le badge, et « Acceptée » sur
 * l'affectation, dans le même écran. L'agent voyait « Acceptée » du sien.
 *
 * L'AGENT NE TERMINE JAMAIS LA MISSION. C'est une décision métier, écrite dans
 * la matrice de `00400` comme ici : un agent qui pourrait clore pourrait le
 * faire avant l'heure, et le temps facturé s'arrêterait.
 *
 * L'agent écrit son rapport et pointe son départ ; le client, seul juge de ce
 * qui a été fait, confirme.
 */
export function useTerminerMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (missionId: string) => missionsService.cloturerMission(missionId),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
      void queryClient.invalidateQueries({ queryKey: CLIENT_MISSIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: AGENT_ASSIGNMENTS_KEY });
    },
  });
}

/**
 * Accepter ou refuser une affectation.
 *
 * `accept_assignment` et `reject_assignment` sont les **deux premières
 * transitions d'état jamais exécutées** dans ce projet. Elles existent au
 * catalogue, leurs droits sont accordés, et rien n'a jamais prouvé qu'elles
 * répondent.
 *
 * L'écran ne montre le bouton d'une réponse que sur une affectation `pending` :
 * la matrice serveur refuse toute autre transition, et un bouton qui échoue
 * est pire qu'un bouton absent.
 */
export function useRepondreAffectation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      affectationId,
      reponse,
    }: {
      affectationId: string;
      reponse: ReponseAffectation;
    }) =>
      reponse === 'accepter'
        ? missionsService.acceptAssignment(affectationId)
        : missionsService.rejectAssignment(affectationId),

    onSuccess: () => {
      // SEULLE la liste de l'agent est invalidée. La liste du client ne peut
      // pas être rafraîchie depuis son téléphone : elle le sera à son prochain
      // chargement, et c'est le comportement attendu d'un écran partagé.
      void queryClient.invalidateQueries({ queryKey: AGENT_ASSIGNMENTS_KEY });
    },
  });
}
