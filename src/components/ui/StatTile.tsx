import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  SHADOWS,
  SPACING,
} from '@/constants';

export type StatTileIconVariant = 'neutral' | 'accent' | 'primary';

interface StatTileProps {
  /** Valeur déjà calculée par l'appelant. Jamais un texte figé dans le composant. */
  value: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconVariant?: StatTileIconVariant;
  /**
   * Contre-libellé sous la valeur : « 86 en patrouille active ».
   *
   * Facultif parce que la maquette ne le porte pas partout, et qu'un espace vide
   * se remarque moins qu'un tiret.
   */
  hint?: string;
}

/**
 * Compteur d'un tableau de bord — « 18 / Agents en vacation ».
 *
 * La maquette le pose en deux variantes : carte blanche avec liseré, et bloc
 * navy pour le chiffre de tête. Seule la première est ici ; la seconde a un
 * contrat différent — fond navy, texte clair, et une place à part dans la
 * hiérarchie — et mérite son propre composant plutôt qu'une prop `variant` qui
 * ferait porter les deux rendus par le même arbre.
 *
 * Transverse par construction : elle reçoit une chaîne. La décision de savoir
 * si « 18 » est vrai appartient à l'écran, qui seul connaît la requête.
 */
export function StatTile({
  value,
  label,
  icon,
  iconVariant = 'neutral',
  hint,
}: StatTileProps) {
  const palette = {
    neutral: { bg: COLORS.surfaceContainerHigh, fg: COLORS.primary },
    accent: { bg: COLORS.accentSurface, fg: COLORS.onAccent },
    primary: { bg: COLORS.primaryLight, fg: COLORS.primaryContainer },
  }[iconVariant];

  return (
    <View style={styles.base}>
      <View style={styles.entete}>
        <View style={[styles.icone, { backgroundColor: palette.bg }]}>
          <MaterialCommunityIcons name={icon} size={16} color={palette.fg} />
        </View>
      </View>

      <Text style={styles.valeur} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.libelle} numberOfLines={2}>
        {label}
      </Text>

      {hint ? (
        <Text style={styles.hint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  entete: {
    marginBottom: SPACING.xs,
  },
  icone: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valeur: {
    // `headline-md` de la maquette : le chiffre domine, le libellé accompagne.
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 32,
    letterSpacing: -0.24,
    color: COLORS.text,
  },
  libelle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  hint: {
    marginTop: 2,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textLight,
  },
});