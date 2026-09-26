import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { COLORS, FONT_FAMILIES, FONT_SIZES } from '@/constants';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'caption'
  | 'label'
  | 'overline';

interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Passe le texte en capitales, comme les libellés de la maquette. */
  uppercase?: boolean;
}

/**
 * Base typographique.
 *
 * Les titres utilisent Plus Jakarta Sans, le texte courant Manrope. Chaque
 * variante désigne un fichier de fonte précis : sur Android, `fontWeight` seul
 * ne suffit pas à sélectionner la bonne graisse dans une famille chargée
 * dynamiquement, il faut passer par `fontFamily`.
 */
export function Typography({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
  uppercase,
}: TypographyProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        uppercase && styles.uppercase,
        color ? { color } : null,
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: COLORS.text,
    fontFamily: FONT_FAMILIES.regular,
  },
  h1: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.huge,
    lineHeight: 48,
    letterSpacing: -0.8, // -0.02em, comme `headline-xl` de la maquette
  },
  h2: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: FONT_FAMILIES.displaySemibold,
    fontSize: FONT_SIZES.xxl,
    lineHeight: 28,
  },
  body: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  label: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
  },
  overline: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
