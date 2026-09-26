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
 * L'ambre de la maquette est réservé aux accréditations officielles ; le
 * `warning` reste donc volontairement saturé, et non pastel comme avant, pour
 * ne pas être confondu avec un statut de mission.
 */
export function Badge({ text, variant = 'primary', style }: BadgeProps) {
  const palette: Record<BadgeVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: 'rgba(0, 210, 255, 0.12)', fg: COLORS.primary },
    success: { bg: 'rgba(0, 200, 83, 0.12)', fg: '#00713B' },
    warning: { bg: 'rgba(243, 156, 18, 0.12)', fg: '#B36B00', border: COLORS.warning },
    error: { bg: 'rgba(186, 26, 26, 0.10)', fg: COLORS.error },
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
