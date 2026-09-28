import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { missionsService, providersService, type PrestataireRef } from '@/services';
import type { TableInsert } from '@/types';
import { CLIENT_MISSIONS_KEY } from './useMissions';

/**
 * Affectations d'une mission.
 *
 * L'IDENTIFIANT DE MISSION EST DANS LA CLÉ, ET NON DANS LE CORPS DE LA
 * FONCTION.
 *
 * Deux requêtes différentes ne peuvent pas partager la même clé : la seconde
 * afficherait le résultat de la première. Et une clé qui ne change jamais ne
 * s'invalide pas correctement après une écriture.
 */
export function assignmentsKey(missionId: string) {
  return ['assignments', missionId] as const;
}

/**
 * Affectations d'une mission, lues par le client qui la possède.
 *
 * `enabled: false` tant qu'aucune mission n'est sélectionnée. Sans cela, la
 * requête partirait avec une chaîne vide et renverrait une erreur qui n'a aucun
 * rapport avec ce que l'utilisateur est en train de faire.
 */
export function useAffectationsMission(missionId: string | null) {
  return useQuery({
    queryKey: assignmentsKey(missionId ?? ''),
    queryFn: () => {
      /*
       * Le garde n'est pas de la défense contre le null : `enabled` garantit
       * que ce code ne s'exécute pas sans identifiant. Il est là pour que
       * TypeScript sache que `missionId` est une chaîne, sans `as` ni valeur
       * par défaut fausse qui masquerait un vrai identifiant.
       */
      if (missionId === null) {
        throw new Error('Aucune mission sélectionnée.');
      }
      return missionsService.listerAffectationsMission(missionId);
    },
    enabled: missionId !== null,
  });
}

/**
 * Noms des prestataires d'une liste d'identifiants.
 *
 * CETTE REQUÊTE EST VOLONTAIREMENT SÉPARÉE DE CELLE DES AFFECTATIONS.
 *
 * Elle dépend de la migration `20260928002100`, qui peut ne pas être encore
 * appliquée. Regroupée avec la lecture des affectations, son échec ferait
 * échouer l'écran entier : l'utilisateur verrait « Chargement impossible » pour
 * une liste qui est, elle, parfaitement lisible.
 *
 * Séparée, son échec ne supprime qu'un nom. C'est la différence entre un écran
 * dégradé et un écran cassé.
 *
 * `retry: 0` : un appel absent du catalogue ne deviendra pas juste en
 * insistant, et trois tentatives retarderaient l'affichage des affectations.
 */
export function useNomsPrestataires(ids: string[]) {
  return useQuery({
    queryKey: ['prestataires', 'noms', ids],
    queryFn: () => providersService.prestatairesParIds(ids),
    enabled: ids.length > 0,
    retry: 0,
  });
}

/** Indexe des prestataires par identifiant, pour un rendu en temps constant. */
export function indexerPrestataires(
  prestataires: PrestataireRef[] | undefined,
): Record<string, PrestataireRef> {
  const index: Record<string, PrestataireRef> = {};
  for (const prestataire of prestataires ?? []) {
    index[prestataire.id] = prestataire;
  }
  return index;
}

/** Ce qu'il faut pour réserver : une mission publiée et un prestataire. */
export type ReserverInput = {
  missionId: string;
  kind: 'agent' | 'company';
  prestataireId: string;
};

/**
 * Réserver un prestataire sur une mission.
 *
 * EXACTEMENT UNE DES DEUX COLONNES EST RENSEIGNÉE, ET C'EST LA BASE QUI L'IMPOSE.
 *
 * La contrainte `mission_assignments_target_check` compte
 * `num_nonnulls(agent_id, company_id) = 1` : une affectation désigne soit un
 * agent, soit une société, jamais les deux, jamais aucune. On construit donc la
 * charge utile à partir de `kind` plutôt que d'envoyer les deux clés et de
 * laisser le serveur trancher : la forme envoyée est alors exactement celle que
 * la politique `Mission owners can create assignments` évalue, et un `kind`
 * inattendu produit une requête invalide visible immédiatement plutôt qu'une
 * ligne refusée à l'exécution.
 *
 * `proposed_rate` N'EST PAS ENVOYÉ. Le montant d'une mission est une décision
 * métier non confirmée (voir « Points à confirmer » du rapport) ; l'inventer
 * ici figerait une règle dans le code avant qu'elle ait été décidée. La
 * colonne reste `null`, et le tarif du prestataire est affiché sans être
 * proposé en face.
 */
export function useReserverPrestataire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ missionId, kind, prestataireId }: ReserverInput) => {
      const charge: Omit<TableInsert<'mission_assignments'>, 'status'> =
        kind === 'agent'
          ? { mission_id: missionId, agent_id: prestataireId }
          : { mission_id: missionId, company_id: prestataireId };

      return missionsService.createAssignment(charge);
    },
    onSuccess: (_resultat, variables) => {
      /*
       * Les DEUX caches sont invalidés, et c'est nécessaire :
       *
       * - les affectations de la mission, pour que la ligne vienne d'elle-même ;
       * - les missions du client, parce que le nombre de prestataires affectés
       *   fait partie de ce que l'écran suivant affiche.
       *
       * Invalider « ce qui a changé » est la règle. Invalider « ce qui est
       * pratique » laisse toujours un écran qui ment sur l'état du serveur.
       */
      void queryClient.invalidateQueries({
        queryKey: assignmentsKey(variables.missionId),
      });
      void queryClient.invalidateQueries({ queryKey: CLIENT_MISSIONS_KEY });
    },
  });
}
