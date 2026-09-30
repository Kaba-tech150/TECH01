import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VARIANTS,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import { useMissionsAdmin } from '@/features/administration';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toUserFacingError } from '@/lib/supabase/errors';
import type { MissionStatus } from '@/types';

/** Filtres de l'écran : un statut, ou toutes les missions. */
type Filtre = 'all' | MissionStatus;

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: 'all', label: 'Toutes' },
  { cle: 'published', label: 'Publiées' },
  { cle: 'in_progress', label: 'En cours' },
  { cle: 'completed', label: 'Terminées' },
  { cle: 'disputed', label: 'Litiges' },
];

/**
 * Écran « Missions » de l'espace administrateur : supervision de la plateforme.
 *
 * LECTURE RÉELLE DEPUIS LE 2026-09-30. L'écran affichait « Bientôt disponible :
 * vue d'ensemble de toutes les missions ».
 *
 * AUCUNE MIGRATION N'A ÉTÉ NÉCESSAIRE, ET C'EST VÉRIFIÉ.
 *
 * La politique « Mission participants can view mission » s'appuie sur
 * `private.can_view_mission`, dont la première condition est
 * `private.is_admin()` : un administrateur ouvre déjà toutes les lignes. Ce qui
 * manquait était l'écran, pas le droit.
 *
 * L'ADMINISTRATEUR NE MODIFIE RIEN ICI, ET L'ÉCRAN LE DIT.
 *
 * Aucune des 11 RPC ne sert à changer l'état d'une mission depuis une liste
 * globale. Ajouter des boutons « Annuler » ou « Clôturer » par ligne
 * offrirait des actions dont l'effet n'a jamais été exécuté sur un compte
 * tiers. L'écran supervise, il n'agit pas.
 *
 * LE FILTRE EST LOCAL, ET C'EST DÉLIBÉRÉ.
 *
 * Filtrer en base enverrait une requête par onglet. La liste d'un
 * administrateur tient en quelques dizaines de lignes : filtrer sur le tableau
 * déjà chargé est instantané, et ne consomme pas le quota de requêtes à chaque
 * changement d'onglet.
 */
export default function AdminMissions() {
  const { data: missions, isPending, isError, error, refetch, isFetching } = useMissionsAdmin();
  const [filtre, setFiltre] = useState<Filtre>('all');

  const messageErreur = toUserFacingError(
    error,
    'Impossible de charger les missions de la plateforme.',
  ).message;

  const visibles = useMemo(() => {
    if (!missions) return [];
    if (filtre === 'all') return missions;
    return missions.filter((mission) => mission.status === filtre);
  }, [missions, filtre]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Missions</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Supervision de toutes les missions de la plateforme
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
      {!isPending && !isError && missions && missions.length === 0 ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Aucune mission</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            La plateforme n&apos;a aucune mission enregistrée. La lecture ayant
            abouti, cette absence est un fait et non un échec d&apos;affichage.
          </Typography>
        </Card>
      ) : null}

      {!isPending && !isError && missions && missions.length > 0 ? (
        <>
          <View style={styles.filtres}>
            {FILTRES.map((option) => {
              const actif = filtre === option.cle;
              return (
                <Pressable
                  key={option.cle}
                  onPress={() => setFiltre(option.cle)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  style={[styles.filtre, actif && styles.filtreActif]}
                >
                  <Typography
                    variant="label"
                    color={actif ? COLORS.onWhite : COLORS.textSecondary}
                  >
                    {option.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          {/*
           * « AUCUNE MISSION POUR CE FILTRE » N'EST PAS « AUCUNE MISSION ».
           *
           * La liste globale n'est pas vide — c'est le filtre qui ne trouve
           * rien. Conflater les deux afficherait « aucune mission » alors qu'il en
           * existe, et l'administrateur croirait la plateforme vide. Le texte dit
           * donc quel filtre ne donne rien, et propose de revenir à « Toutes ».
           */}
          {visibles.length === 0 ? (
            <Card style={styles.carte}>
              <Typography variant="h3">Aucune mission dans ce filtre</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
                {`${missions.length} mission${missions.length > 1 ? 's' : ''} sur la plateforme, aucune au statut « ${
                  FILTRES.find((option) => option.cle === filtre)?.label ?? ''
                } ».`}
              </Typography>
              <Button
                title="Voir toutes les missions"
                variant="outline"
                size="md"
                onPress={() => setFiltre('all')}
                style={styles.action}
              />
            </Card>
          ) : null}

          {visibles.map((mission) => (
            <View key={mission.id} style={styles.mission}>
              <View style={styles.missionHaut}>
                <View style={styles.missionTextes}>
                  <Typography variant="h3" numberOfLines={2}>
                    {mission.title}
                  </Typography>
                  <Typography variant="caption" color={COLORS.textSecondary} style={styles.meta}>
                    {`${mission.city} · ${formatDate(mission.startTime)}`}
                  </Typography>
                </View>

                <Badge
                  text={MISSION_STATUS_LABELS[mission.status]}
                  variant={MISSION_STATUS_VARIANTS[mission.status]}
                />
              </View>

              <View style={styles.puces}>
                <View style={styles.puce}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    {`${formatDate(mission.startTime, 'time')} – ${formatDate(mission.endTime, 'time')}`}
                  </Typography>
                </View>

                {/*
                 * LE BUDGET EST OMIS S'IL EST NUL, ET JAMAIS REMPLACÉ PAR UN MONTANT.
                 *
                 * `missions.budget` est facultatif. Écrire « 0 € » ferait croire
                 * à une mission gratuite ; ne rien écrire dit la même chose sans
                 * inventer de chiffre.
                 */}
                {mission.budget !== null ? (
                  <View style={styles.puce}>
                    <MaterialCommunityIcons name="cash-multiple" size={14} color={COLORS.textSecondary} />
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      {formatCurrency(mission.budget)}
                    </Typography>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
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
  filtres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  filtre: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  /*
   * LE FILTRE ACTIF EST UN APLAT NOIR, COMME LES BOUTONS.
   *
   * `COLORS.primary` est le noir des actions de la maquette. Un filtre actif
   * qui reste gris ferait indistinguishable l'onglet courant d'un inactif : on ne
   * saurait plus sur quelle vue on se trouve.
   */
  filtreActif: {
    backgroundColor: COLORS.primary,
  },
  mission: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    gap: SPACING.md,
  },
  missionHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  missionTextes: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: 2,
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
