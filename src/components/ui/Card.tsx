import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  HAIRLINE_COBALT,
  HAIRLINE_CYAN,
  SHADOWS,
  SPACING,
} from '@/constants';

export type CardVariant = 'default' | 'secondary' | 'elevated' | 'ghost';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  /** Ajoute le liseré cyan de 1px sur le bord supérieur (signature de la marque). */
  accent?: boolean;
  padding?: number;
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
}: CardProps) {
  return (
    <View style={[styles.card, styles[variant], { padding }, style]}>
      {accent ? <View style={styles.accent} /> : null}
      {children}
    </View>
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
    borderColor: HAIRLINE_CYAN,
    ...SHADOWS.card,
  },
  elevated: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HAIRLINE_COBALT,
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
    height: 1,
    backgroundColor: 'rgba(0, 210, 255, 0.35)',
    zIndex: 1,
  },
});
