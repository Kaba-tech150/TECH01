import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/common';
import { Button, Card, SectionHeader, Typography } from '@/components/ui';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { MissionCard, useClientMissions } from '@/features/missions';
import { useVilles } from '@/features/villes';

/**
 * Prestations proposées.
 *
 * Ce bloc est du contenu éditorial : il décrit l'offre et ne revendique aucun
 * chiffre. C'est ce qui le distingue des statistiques, qui sont calculées.
 */
const PRESTATIONS = [
  {
    icon: 'office-building-outline' as const,
    title: 'Surveillance de site',
    description: "Gardiens d'immeubles, commisseries et rondes de nuit",
  },
  {
    icon: 'calendar-star' as const,
    title: 'Événementiel',
    description: 'Filtrage, palpation, gestion des foules et de la voie',
  },
  {
    icon: 'shield-account' as const,
    title: 'Protection VIP',
    description: 'Chaîne de sécurité, escorte et suivi rapproché',
  },
  {
    icon: 'fire-truck' as const,
    title: 'Agents SSIAP',
    description: 'Sapeurs-pompiers gradués pour les sites sensibles',
  },
];

export default function ClientIndex() {
  const router = useRouter();
  const { data: missions, isPending } = useClientMissions();
  const {
    data: villes,
    isPending: villesEnCours,
    isError: villesEnErreur,
  } = useVilles();

  /*
   * Tous les compteurs de cet écran sont dérivés de la liste réellement
   * chargée. Aucun n'est codé en dur : une statistique figée affichant « 142 »
   * alors que la base est vide est le meilleur moyen de faire croire à un
   * backend fonctionnel qui ne l'est pas.
   */
  const total = missions?.length ?? 0;
  const enCours =
    missions?.filter(
      (mission) => mission.status !== 'draft' && mission.status !== 'cancelled',
    ).length ?? 0;
  const brouillons = missions?.filter((mission) => mission.status === 'draft').length ?? 0;
  const recentes = missions?.slice(0, 2) ?? [];

  return (
    <View style={styles.root}>
      <AppHeader onPressProfile={() => router.push('/(client)/profile')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Télémétrie — données réelles */}
        <View style={styles.ticker}>
          <View style={styles.tickerDot} />
          <Text style={styles.tickerText}>
            {isPending
              ? 'Chargement de vos opérations'
              : total === 0
                ? 'Aucune mission enregistrée'
                : `${total} mission${total > 1 ? 's' : ''} · ${enCours} en cours`}
          </Text>
        </View>

        {/* Bloc d'appel à l'action */}
        <Card variant="elevated" accent style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <View style={styles.chip}>
                <MaterialCommunityIcons
                  name="shield-account"
                  size={13}
                  color={COLORS.primary}
                />
                <Text style={styles.chipText}>Donneurs d&apos;ordre &amp; VIP</Text>
              </View>
              <Typography variant="h3" style={styles.heroTitle}>
                Besoin d&apos;un agent de sécurité ?
              </Typography>
              <Typography variant="caption" style={styles.heroBody}>
                Surveillance continue, filtrage d&apos;accès événementiel ou
                protection rapprochée immédiate.
              </Typography>
            </View>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="shield" size={22} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.heroActions}>
            <Button
              title="Commander"
              icon="lightning-bolt"
              onPress={() => router.push('/(client)/mission/new')}
              style={styles.heroButton}
            />
            <Button
              title="Mes missions"
              variant="outline"
              icon="clipboard-text-outline"
              onPress={() => router.push('/(client)/missions')}
              style={styles.heroButton}
            />
          </View>

          <View style={styles.heroFooter}>
            <MaterialCommunityIcons
              name="shield-check"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.heroFooterText}>
              Déploiement dès 45 min avec contrôle d&apos;agrément CNAPS
            </Text>
          </View>
        </Card>


        {/* Couverture — réelle, alimentée par le référentiel des villes */}
        <Card style={styles.coverage}>
          <View style={styles.coverageRow}>
            <View style={styles.coverageIcon}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.coverageCopy}>
              <Typography variant="label" style={styles.coverageTitle}>
                Couverture opérationnelle
              </Typography>
              {/*
                * `isPending` et `isError` sont distingués : sans cela, un échec
                * de la requête afficherait « Chargement » indéfiniment, ce qui
                * ferait croire à un réseau lent alors que la table `villes`
                * est peut-être simplement absente.
                */}
              <Typography variant="caption">
                {villesEnErreur
                  ? 'Zones indisponibles'
                  : villesEnCours
                    ? 'Chargement des zones…'
                    : `${villes?.length ?? 0} ville${villes?.length === 1 ? '' : 's'} desservie${villes?.length === 1 ? '' : 's'}`}
              </Typography>
            </View>
            <Button
              title="Choisir"
              variant="secondary"
              size="md"
              onPress={() => router.push('/(client)/mission/new')}
            />
          </View>
        </Card>

        {/* Statistiques — réelles */}
        <View style={styles.stats}>
          <StatTile label="En cours" value={enCours} />
          <StatTile label="Brouillons" value={brouillons} />
          <StatTile label="Total" value={total} />
        </View>

        {/* Prestations — éditorial, sans chiffre revendiqué */}
        <View>
          <SectionHeader title="Prestations qualifiées" />
          <View style={styles.grid}>
            {PRESTATIONS.map((prestation) => (
              <View key={prestation.title} style={styles.tile}>
                <MaterialCommunityIcons
                  name={prestation.icon}
                  size={20}
                  color={COLORS.cobalt}
                />
                <Text style={styles.tileTitle}>{prestation.title}</Text>
                <Text style={styles.tileBody}>{prestation.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dernières missions — réelles */}
        {recentes.length > 0 ? (
          <View>
            <SectionHeader
              title="Dernières missions"
              actionLabel="Tout voir"
              onPressAction={() => router.push('/(client)/missions')}
            />
            {recentes.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </View>
        ) : null}

        {/* Appel final */}
        <Card style={styles.cta}>
          <View style={styles.ctaIcon}>
            <MaterialCommunityIcons name="shield" size={24} color={COLORS.primary} />
          </View>
          <Typography variant="h3" style={styles.ctaTitle}>
            Sécurisez vos opérations en 3 clics
          </Typography>
          <Typography variant="caption" style={styles.ctaBody}>
            Demande chiffrée, affectation d&apos;agents vérifiés, paiement
            sécurisé.
          </Typography>
          <Button
            title="Lancer une mission"
            icon="lightning-bolt"
            onPress={() => router.push('/(client)/mission/new')}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

/** Tuile de statistique : la valeur est un nombre, jamais une chaîne libre. */
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },

  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },
  tickerText: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
  },

  hero: {
    backgroundColor: COLORS.surfaceContainer,
    gap: SPACING.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  heroCopy: {
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.primary,
  },
  heroTitle: {
    marginBottom: SPACING.xs,
  },
  heroBody: {
    lineHeight: 19,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  heroButton: {
    flex: 1,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  heroFooterText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  coverage: {
    paddingVertical: SPACING.md,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  coverageIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverageCopy: {
    flex: 1,
  },
  coverageTitle: {
    marginBottom: 2,
  },

  stats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    /*
     * `48%` + `flexGrow: 1` plutôt que `flex: 1` : deux colonnes de largeurs
     * égales avec un espace constant. `flex: 1` rognerait inutilement la
     * couleur de fond de chaque tuile.
     */
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.14)',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  tileTitle: {
    fontFamily: FONT_FAMILIES.displaySemibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  tileBody: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  cta: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    gap: SPACING.sm,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  ctaTitle: {
    textAlign: 'center',
  },
  ctaBody: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});

