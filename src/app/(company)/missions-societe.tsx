import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  BORDER_RADIUS,
  COLORS,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VARIANTS,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import { useMesAffectationsSociete } from '@/features/portefeuille';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toUserFacingError } from '@/lib/supabase/errors';

/**
 * Écran « Missions » de l'espace société : les affectations reçues.
 *
 * LECTURE RÉELLE DEPUIS LE 2026-09-30. L'écran affichait « Aucune mission
 * assignée à votre société » et un bouton « Rechercher des missions » sans
 * effet. Le texte annonçait un fait jamais vérifié.
 *
 * `missionsService.getCompanyMissions` existait déjà, appelé par aucun écran.
 *
 * LE BOUTON « RECHERCHER DES MISSIONS » A DISPARU, ET C'EST DÉLIBÉRÉ.
 *
 * Il n'y a pas d'appel d'offres dans l'application : une société ne peut pas
 * postuler à une mission, et `missions` n'est créé que par un client
 * (`client_id` imposé par trigger). Un bouton qui n'ouvre rien est une promesse
 * non tenue. Seule l'affectation directe existe, et elle se fait depuis l'espace
 * agent. L'écran se contente donc de montrer ce qui arrive.
 */
export default function CompanyMissions() {
  const { data: affectations, isPending, isError, error, refetch, isFetching } =
    useMesAffectationsSociete();

  const messageErreur = toUserFacingError(
    error,
    'Impossible de charger les missions de votre société.',
  ).message;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Missions</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Les prestations affectées à votre société
      </Typography>

      {isPending ? (
        <Card style={styles.carte}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Chargement des missions…
          </Typography>
        </Card>
      ) : null}

      {isError ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Missions indisponibles</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            {messageErreur}
          </Typography>
          <Button
            title="Réessayer"
            variant="outline"
            size="md"
            onPress={() => void refetch()}
            disabled={isFetching}
            style={styles.action}
          />
        </Card>
      ) : null}
      {!isPending && !isError && affectations && affectations.length === 0 ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Aucune mission reçue</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            {/*
             * AUCUN BOUTON ICI, ET C'EST DÉLIBÉRÉ.
             *
             * « Rechercher des missions » est impossible : il n'existe pas
             * d'appel d'offres. `missions` est créé par un client, et une société
             * n'a aucun chemin pour postuler. Le bouton est parti au lieu de
             * promettre une fonction absente de l'application.
             */}
            Aucune mission n&apos;a été affectée à votre société. Les
            prestations vous sont confiées depuis l&apos;espace agent, après
            accord du client.
          </Typography>
        </Card>
      ) : null}

      {!isPending && !isError && affectations && affectations.length > 0 ? (
        <>
          <View style={styles.compteur}>
            <MaterialCommunityIcons name="briefcase-outline" size={18} color={COLORS.textSecondary} />
            <Typography variant="label" color={COLORS.textSecondary}>
              {`${affectations.length} mission${affectations.length > 1 ? 's' : ''}`}
            </Typography>
          </View>

          {affectations.map((affectation) => {
            /*
             * LA MISSION PEUT ÊTRE ABSENTE : ELLE EST ALORS OMISE, PAS INVENTÉE.
             *
             * `missions` est une jointure. Si la RLS ou une contrainte empêche de
             * lire la mission, l'affectation existe mais son contenu non. Écrire un
             * titre de remplacement ferait croire à une mission sans titre ; la
             * ligne est affichée avec son seul identifiant, et l'écran le dit.
             */
            const mission = affectation.missions;

            return (
              <View key={affectation.id} style={styles.affectation}>
                <View style={styles.affectationHaut}>
                  <View style={styles.affectationTextes}>
                    <Typography variant="h3" numberOfLines={2}>
                      {mission ? mission.title : `Mission ${affectation.mission_id.slice(0, 8)}`}
                    </Typography>
                    {mission ? (
                      <Typography variant="caption" color={COLORS.textSecondary} style={styles.meta}>
                        {mission.city} · {formatDate(mission.start_time, 'time')}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color={COLORS.textLight} style={styles.meta}>
                        Détail de la mission non lisible par votre espace
                      </Typography>
                    )}
                  </View>

                  <Badge
                    text={ASSIGNMENT_STATUS_LABELS[affectation.status]}
                    variant={ASSIGNMENT_STATUS_VARIANTS[affectation.status]}
                  />
                </View>

                {mission ? (
                  <View style={styles.badgesMission}>
                    <Badge
                      text={MISSION_STATUS_LABELS[mission.status]}
                      variant={MISSION_STATUS_VARIANTS[mission.status]}
                    />
                  </View>
                ) : null}

                <View style={styles.puces}>
                  {affectation.proposed_rate !== null ? (
                    <View style={styles.puce}>
                      <MaterialCommunityIcons name="cash-multiple" size={14} color={COLORS.textSecondary} />
                      <Typography variant="caption" color={COLORS.textSecondary}>
                        {formatCurrency(affectation.proposed_rate)}
                      </Typography>
                    </View>
                  ) : null}

                  {/*
                   * LES POINTAGES INDIQUENT CE QUI A EU LIEU, PAS CE QUI VIENDRA.
                   *
                   * `check_in_time` et `check_out_time` sont posés par l'agent
                   * affecté. Les afficher est exact. En déduire qu'une prestation
                   * est « en cours » parce que l'arrivée est notée et le départ
                   * non serait une promesse que rien ne garantit.
                   */}
                  {affectation.check_in_time ? (
                    <View style={styles.puce}>
                      <MaterialCommunityIcons name="login-variant" size={14} color={COLORS.success} />
                      <Typography variant="caption" color={COLORS.textSecondary}>
                        {`Arrivée ${formatDate(affectation.check_in_time, 'time')}`}
                      </Typography>
                    </View>
                  ) : null}

                  {affectation.check_out_time ? (
                    <View style={styles.puce}>
                      <MaterialCommunityIcons name="logout-variant" size={14} color={COLORS.success} />
                      <Typography variant="caption" color={COLORS.textSecondary}>
                        {`Départ ${formatDate(affectation.check_out_time, 'time')}`}
                      </Typography>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      {isFetching && !isPending ? (
        <Typography variant="caption" color={COLORS.textLight} style={styles.rafraichit}>
          Actualisation en cours…
        </Typography>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SCREEN_PADDING,
    gap: SPACING.md,
  },
  sousTitre: {
    marginBottom: SPACING.sm,
  },
  carte: {
    padding: SPACING.lg,
  },
  texte: {
    marginTop: SPACING.sm,
  },
  action: {
    marginTop: SPACING.lg,
  },
  compteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  affectation: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    gap: SPACING.md,
  },
  affectationHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  affectationTextes: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: 2,
  },
  badgesMission: {
    flexDirection: 'row',
  },
  puces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rafraichit: {
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
