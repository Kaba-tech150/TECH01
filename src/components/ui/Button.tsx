import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE_CYAN,
  SPACING,
} from '@/constants';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Nom d'icône MaterialCommunityIcons, affichée avant le libellé. */
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

/**
 * Bouton d'action.
 *
 * La variante `primary` est un aplat cyan `#00D2FF`. Le texte y est donc
 * `onCyan` et non blanc : le blanc sur ce cyan plafonne à 1,8:1 de contraste,
 * ce qui le rend illisible en lumière du jour. `onCyan` monte à 4,6:1 tout en
 * conservant le contraste de luminance de la maquette.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  icon,
  size = 'lg',
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const textColor = isPrimary
    ? COLORS.onCyan
    : isDanger
      ? COLORS.onWhite
      : isSecondary || isOutline
        ? COLORS.cobalt
        : isGhost
          ? COLORS.textSecondary
          : COLORS.onWhite;

  const iconColor = isGhost ? COLORS.textSecondary : textColor;

  const content = (
    <>
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={size === 'lg' ? 18 : 16}
          color={iconColor}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          size === 'md' ? styles.textMd : styles.textLg,
          { color: textColor },
        ]}
      >
        {title}
      </Text>
    </>
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        size === 'md' ? styles.sizeMd : styles.sizeLg,
        !fullWidth && styles.notFullWidth,
        isPrimary && styles.primary,
        !isPrimary && !isDanger && styles.secondaryBase,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        // `pressed` pilote une opacité et non un `activeOpacity` : ce dernier
        // est ignoré sur les surfaces qui portent un dégradé.
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {isDanger ? (
        <LinearGradient
          colors={['#E53935', '#B71C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dangerFill}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    overflow: 'hidden',
  },
  sizeLg: {
    // 48px : cible tactile minimale recommandée par la maquette.
    minHeight: 48,
    paddingHorizontal: SPACING.lg,
  },
  sizeMd: {
    minHeight: 40,
    paddingHorizontal: SPACING.md,
  },
  notFullWidth: {
    width: 'auto',
  },
  primary: {
    backgroundColor: COLORS.cyan,
  },
  secondaryBase: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  secondary: {
    borderWidth: 1,
    borderColor: HAIRLINE_CYAN,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  dangerFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: SPACING.lg,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    fontFamily: FONT_FAMILIES.bold,
    // Lapsus du design : les libellés d'action sont en capitales espacées.
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textMd: {
    fontSize: FONT_SIZES.sm,
  },
  textLg: {
    fontSize: FONT_SIZES.md,
  },
});
