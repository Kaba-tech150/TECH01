import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES } from '@/constants';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pastille d'état.
 *
 * Les aplats sont ceux de la maquette, pas des teintes construites à la main :
 *   - `primary`   : bleu pâle `#DAE2FD` sur texte navy — le badge
 *                   « PLATEFORME NATIONALE CERTIFIÉE CNAPS » et les
 *                   « Excellent / Conforme / Impeccable » de l'évaluation.
 *   - `warning`   : ambre pâli `#FCDEB5` — l'ambre est réservé aux
 *                   accréditations et états actifs, jamais à un statut d'alerte.
 */
export function Badge({ text, variant = 'primary', style }: BadgeProps) {
  const palette: Record<BadgeVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: COLORS.primaryLight, fg: COLORS.primaryContainer },
    success: { bg: COLORS.successSurface, fg: COLORS.success },
    warning: { bg: COLORS.accentSurface, fg: COLORS.onAccent },
    error: { bg: COLORS.errorSurface, fg: COLORS.onErrorContainer },
    neutral: { bg: COLORS.surfaceContainerHigh, fg: COLORS.textSecondary },
  };

  const { bg, fg, border } = palette[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        border ? { borderWidth: 1, borderColor: border } : null,
        style,
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  text: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
