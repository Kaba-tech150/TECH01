import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';

interface SectionHeaderProps {
  title: string;
  /** Action optionnelle affichée à droite, ex. « Voir tout ». */
  actionLabel?: string;
  onPressAction?: () => void;
  /** Sous-titre ou contre-libellé à droite, ex. « Île-de-France ». */
  trailing?: string;
}

/** En-tête de section : titre à gauche, action ou contre-libellé à droite. */
export function SectionHeader({
  title,
  actionLabel,
  onPressAction,
  trailing,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {actionLabel && onPressAction ? (
        <Pressable
          onPress={onPressAction}
          style={styles.action}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : trailing ? (
        <Text style={styles.trailing}>{trailing}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 26,
    color: COLORS.text,
    flexShrink: 1,
  },
  action: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  actionText: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primaryContainer,
    letterSpacing: 0.5, // 0.05em, comme `label-sm` de la maquette
    textTransform: 'uppercase',
  },
  trailing: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
});