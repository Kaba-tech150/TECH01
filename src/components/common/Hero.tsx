import { View, Text, StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { Button } from '@/components/ui';

interface HeroProps {
  onRequestServicePress?: () => void;
  onBecomeProviderPress?: () => void;
}

export function Hero({ onRequestServicePress, onBecomeProviderPress }: HeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Plateforme active 24/7</Text>
      </View>

      <Text style={styles.heroTitle}>
        Sécurité professionnelle{'\n'}
        <Text style={styles.heroTitleAccent}>
          à portée de main
        </Text>
      </Text>

      <Text style={styles.heroDescription}>
        Connectez-vous avec des agents certifiés et des sociétés de gardiennage
        pour sécuriser vos biens et événements.
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>500+</Text>
          <Text style={styles.statLabel}>Agents certifiés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>50+</Text>
          <Text style={styles.statLabel}>Sociétés partenaires</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Satisfaction</Text>
        </View>
      </View>

      <Button
        title="Demander un service"
        onPress={onRequestServicePress || (() => {})}
        variant="primary"
      />

      <Button
        title="Devenir prestataire"
        onPress={onBecomeProviderPress || (() => {})}
        variant="outline"
        style={styles.secondaryButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.lg,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },

  statusText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.semibold,
  },

  heroTitle: {
    fontSize: FONT_SIZES.huge,
    lineHeight: 45,
    fontFamily: FONT_FAMILIES.display,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  heroTitleAccent: {
    color: COLORS.primary,
  },

  heroDescription: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONT_FAMILIES.display,
    color: COLORS.primary,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILIES.medium,
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  secondaryButton: {
    marginTop: SPACING.md,
  },
});
