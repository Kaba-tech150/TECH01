import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE,
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
 * La variante `primary` est un aplat NOIR `#000000` : c'est la couleur des
 * boutons de la maquette (« Créer un compte », « Se connecter à l'espace
 * sécurisé », « Confirmer l'accès sécurisé »). Le texte y est donc `onPrimary`
 * (blanc), qui monte à 21:1 de contraste.
 *
 * Le libellé n'est PAS en capitales. La maquette écrit « Se connecter à l'espace
 * sécurisé » en casse de phrase, en Hanken Grotesk 600.
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

  const textColor = isPrimary || isDanger
    ? COLORS.onPrimary
    : isSecondary || isOutline
      ? COLORS.text
      : isGhost
        ? COLORS.textSecondary
        : COLORS.onPrimary;

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
        isDanger && styles.danger,
        !isPrimary && !isDanger && styles.secondaryBase,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        // `pressed` pilote une opacité et non un `activeOpacity`, qui
        // n'est pas rendu sur un `Pressable` dont le style est une fonction.
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
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
    backgroundColor: COLORS.primary,
  },
  /**
   * Aplat rouge plein, sans dégradé.
   *
   * La maquette ne dessine aucun dégradé : le bandeau SOS est un rouge saturé
   * uniforme, pour qu'il ne puisse pas être confondu avec un bouton ordinal.
   */
  danger: {
    backgroundColor: COLORS.dangerSolid,
  },
  secondaryBase: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  secondary: {
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
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
    fontFamily: FONT_FAMILIES.semibold,
  },
  textMd: {
    fontSize: FONT_SIZES.sm,
  },
  textLg: {
    fontSize: FONT_SIZES.md,
  },
});
