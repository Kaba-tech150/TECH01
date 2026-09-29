import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  HAIRLINE,
  HAIRLINE_ACCENT,
  SHADOWS,
  SPACING,
} from '@/constants';

export type CardVariant = 'default' | 'secondary' | 'elevated' | 'ghost';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  /** Ajoute le liseré ambre de 1px sur le bord supérieur (signature de la marque). */
  accent?: boolean;
  padding?: number;
  /**
   * Rend la carte actionnable.
   *
   * FACULTATIF, ET LE COMPORTEMENT DIFFÈRE VRAIMENT : sans gestionnaire, la
   * carte reste une `View` et n'est pas annoncée comme un bouton. Avec, elle
   * devient un `Pressable` — et le lecteur d'écran le sait.
   *
   * `onPress` plutôt qu'un booléen `isPressable` : une carte annoncée comme
   * bouton mais insensible est un défaut d'accessibilité, et il n'apparaît qu'à
   * l'usage, jamais à la compilation.
   */
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Surface de contenu.
 *
 * Les trois niveaux suivent `design/DESIGN.md` : `secondary` est la carte de
 * travail surélevée, `elevated` le niveau action, `default` le conteneur plat.
 * Le liseré du bord supérieur est rendu par une `View` absolutely positioned
 * plutôt que par `borderTopWidth`, afin que l'ombre ne soit pas interrompue
 * sur les angles arrondis.
 */
export function Card({
  children,
  style,
  variant = 'default',
  accent = false,
  padding = SPACING.lg,
  onPress,
  accessibilityLabel,
}: CardProps) {
  /*
   * LE STYLE EST CALCULÉ UNE SEULE FOIS, POUR LES DEUX FORMES.
   *
   * Le dupliquer entre la `View` et le `Pressable` ferait diverger les deux
   * rendus au premier changement de variante — et la divergence n'apparaîtrait
   * que sur les cartes actionnables, c'est-à-dire celles qu'on regarde le moins.
   */
  const styleCarte = [styles.card, styles[variant], { padding }, style];

  const contenu = (
    <>
      {accent ? <View style={styles.accent} /> : null}
      {children}
    </>
  );

  if (!onPress) {
    return <View style={styleCarte}>{contenu}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styleCarte}
    >
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HAIRLINE,
    ...SHADOWS.card,
  },
  elevated: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.raised,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: HAIRLINE_ACCENT,
    zIndex: 1,
  },
});
