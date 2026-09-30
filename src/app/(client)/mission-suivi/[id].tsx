import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VARIANTS,
  SPACING,
} from '@/constants';
import {
  CarteAffectation,
  indexerPrestataires,
  useAffectationsMission,
  useMission,
  useMissionErrorMessage,
  useNomsPrestataires,
  useTerminerMission,
} from '@/features/missions';
import { formatDate } from '@/lib/utils';

/**
 * Suivi d'une mission : son état, et les prestataires qui y ont répondu.
 *
 * DERNIER JALON DU PARCOURS CLIENT, ET LE PREMIER OÙ LE CLIENT APPREND
 * QUELQUE CHOSE.
 *
 * Tant que cet écran n'existait pas, un client qui réservait un prestataire
 * n'avait AUCUN moyen de connaître la réponse. L'affectation restait `pending`
 * en base, et l'interface ne disait rien. Ce n'était pas un manque de
 * fonctionnalité, c'était une impasse : l'utilisateur la rencontrait
 * immédiatement, et il n'y avait rien à lui montrer.
 *
 * L'écran affiche les mêmes cartes d'affectation que l'agent, via
 * `CarteAffectation`. Deux implémentations parallèles divergeraient au premier
 * changement de libellé, et les deux écrans « fonctionneraient » séparément.
 */
export default function SuiviMission() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const messageErreur = useMissionErrorMessage();
  const terminer = useTerminerMission();
  const [erreurCloture, setErreurCloture] = useState<string | null>(null);

  const missionId = typeof id === 'string' && id.length > 0 ? id : null;

  const { data: mission, isPending, isError, error, refetch } =
    useMission(missionId);
  const { data: affectations } = useAffectationsMission(missionId);

  /*
   * LES NOMS SONT DEMANDÉS POUR LES IDENTIFIANTS RÉELLEMENT PRÉSENTS.
   *
   * Une affectation `rejected` n'est pas lisible par le client :
   * `can_view_assignment` exige `pending`, `accepted` ou `completed`. La liste
   * renvoyée ne contient donc que des affectations visibles, et l'identifiant
   * ne peut pas être `null` pour une ligne existante — mais le type le dit, et
   * on ne suppose pas le contraire d'un type.
   */
  const ids = useMemo(() => {
    const liste: string[] = [];
    for (const affectation of affectations ?? []) {
      const identifiant = affectation.agent_id ?? affectation.company_id;
      if (identifiant) liste.push(identifiant);
    }
    return liste;
  }, [affectations]);

  const noms = useNomsPrestataires(ids);
  const index = useMemo(() => indexerPrestataires(noms.data), [noms.data]);

  /*
   * LE BOUTON DE CLÔTURE N'APPARAÎT QU'UNE VACATION EST TERMINÉE.
   *
   * Deux conditions, et toutes deux nécessaires :
   *
   *   - la mission est `in_progress` : c'est la seule condition que la matrice
   *     accepte pour `complete_mission`. L'agent la fait passer de `accepted` à
   *     `in_progress` en pointant son arrivée.
   *   - au moins un agent a pointé son DÉPART. Sans cela, le client clôturerait
   *     une mission dont personne n'a terminé le service.
   *
   * Un bouton qui échoue est pire qu'un bouton absent : il fait perdre
   * confiance à tout l'écran. Les deux conditions sont donc vérifiées ici, et
   * la troisième — l'autorisation — reste dans la base.
   */
  const vacationTerminee =
    mission?.status === 'in_progress' &&
    (affectations ?? []).some((affectation) => Boolean(affectation.check_out_time));

  const cloturer = async () => {
    if (!mission) return;
    setErreurCloture(null);
    try {
      await terminer.mutateAsync(mission.id);
    } catch (e) {
      setErreurCloture(
        messageErreur(e, 'clôturer', 'Impossible de clôturer la mission.'),
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        {isPending ? (
          <View style={styles.centre}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null}

        {isError ? (
          <Card style={styles.carte}>
            <Typography variant="h3">Chargement impossible</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              {messageErreur(error, 'charger')}
            </Typography>
            <Button title="Réessayer" onPress={() => void refetch()} />
          </Card>
        ) : null}

        {mission ? (
          <Card style={styles.carte}>
            <View style={styles.entete}>
              <Typography variant="h2" style={styles.titre}>
                {mission.title}
              </Typography>
              <Badge
                text={MISSION_STATUS_LABELS[mission.status]}
                variant={MISSION_STATUS_VARIANTS[mission.status]}
              />
            </View>

            <View style={styles.creneau}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Du {formatDate(mission.start_time, 'long')}
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                au {formatDate(mission.end_time, 'long')}
              </Typography>
            </View>

            <Typography style={styles.lieu}>
              {mission.address}, {mission.city}
            </Typography>
          </Card>
        ) : null}

        {mission ? (
          <Typography variant="h3" style={styles.sousTitreListe}>
            Prestataires
          </Typography>
        ) : null}

        {mission && affectations && affectations.length === 0 ? (
          <Card style={styles.carte}>
            <Typography variant="h3">Aucun prestataire pour l’instant</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              Dès que vous aurez réservé un prestataire pour cette mission, il
              apparaîtra ici avec sa réponse.
            </Typography>
            <Button
              title="Rechercher un prestataire"
              variant="secondary"
              onPress={() => router.replace('/(client)/search')}
            />
          </Card>
        ) : null}

        {vacationTerminee ? (
          <Card style={styles.carteCloture}>
            <Typography variant="h3">La mission est-elle terminée ?</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              Votre prestataire a pointé son départ. Confirmez que la prestation
              est terminée pour clore la mission. C’est vous seul qui pouvez le
              décider.
            </Typography>
            <Button
              title="Confirmer la fin de la mission"
              icon="check-decagram"
              onPress={() => void cloturer()}
              disabled={terminer.isPending}
            />
          </Card>
        ) : null}

        {erreurCloture ? (
          <Card style={styles.carteErreur}>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              {erreurCloture}
            </Typography>
          </Card>
        ) : null}

        {affectations?.map((affectation) => {
          const prestataireId =
            affectation.agent_id ?? affectation.company_id ?? '';

          return (
            <CarteAffectation
              key={affectation.id}
              status={affectation.status}
              createdAt={affectation.created_at}
              prestataireId={prestataireId}
              prestataire={prestataireId ? index[prestataireId] : undefined}
              checkInTime={affectation.check_in_time}
              checkOutTime={affectation.check_out_time}
              rapport={affectation.report}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  conteneur: {
    flex: 1,
  },
  contenu: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  centre: {
    paddingVertical: SPACING.xxl,
  },
  carte: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  titre: {
    flex: 1,
  },
  creneau: {
    gap: 2,
  },
  lieu: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingTop: SPACING.sm,
  },
  sousTitreListe: {
    marginBottom: SPACING.md,
  },
  carteCloture: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  carteErreur: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  texte: {
    lineHeight: 20,
  },
});

