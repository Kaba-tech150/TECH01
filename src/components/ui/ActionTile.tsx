import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SHADOWS, SPACING } from '@/constants';

export type TuileIconVariant = 'secondary' | 'neutral' | 'accent';

interface ActionTileProps {
  title: string;
  /** Contre-libellé sous le titre : « SSIAP, VIP, Rondier ». */
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  iconVariant?: TuileIconVariant;
}

/**
 * Tuile d'action rapide — « Actions Rapides » de la maquette.
 *
 * Reprend les proportions relevées sur `design/secuguard_accueil_client.html` :
 * grille de deux colonnes, `h-28` de hauteur, icône dans un carré
 * `bg-secondary-container`, titre en `label-md`, contre-libellé en `body-sm`.
 *
 * Transverse : elle reçoit un libellé, une icône et un gestionnaire. Elle ne
 * connaît ni la route, ni le rôle, ni la donnée — la décision d'afficher
 * « 3 vacations à venir » appartient à l'écran, qui seul sait si c'est vrai.
 */
export function ActionTile({
  title,
  subtitle,
  icon,
  onPress,
  iconVariant = 'neutral',
}: ActionTileProps) {
  const palette = {
    secondary: { bg: COLORS.secondaryContainer, fg: COLORS.onSecondaryContainer },
    neutral: { bg: COLORS.surfaceContainerHigh, fg: COLORS.text },
    accent: { bg: COLORS.primaryLight, fg: COLORS.primaryContainer },
  }[iconVariant];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      // `pressed` et non `activeOpacity` : ce dernier n'est pas rendu quand le
      // style d'un `Pressable` est une fonction, ce qui est le cas ici.
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <View style={[styles.icone, { backgroundColor: palette.bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={palette.fg} />
      </View>

      <View style={styles.textes}>
        <Text style={styles.titre} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.sousTitre} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    /*
     * `48%` + `flexGrow: 1` plutôt que `flex: 1` : la maquette est une grille de
     * deux colonnes de largeur ÉGALE, avec un gouttière constant. `flex: 1`
     * rognerait la couleur de fond de chaque tuile.
     */
    width: '48%',
    flexGrow: 1,
    height: 112, // h-28 de la maquette
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    ...SHADOWS.card,
  },
  pressed: {
    opacity: 0.85,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: {
    gap: 2,
  },
  titre: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
    color: COLORS.text,
  },
  sousTitre: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },
});