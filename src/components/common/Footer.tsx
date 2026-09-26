import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/constants';

export function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLogo}>
        <Text style={styles.footerText}>SecuGuard</Text>
        <Text style={styles.footerTagline}>Votre sécurité, notre priorité</Text>
      </View>

      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>Mentions légales</Text>
        <Text style={styles.footerSeparator}>•</Text>
        <Text style={styles.footerLink}>Confidentialité</Text>
        <Text style={styles.footerSeparator}>•</Text>
        <Text style={styles.footerLink}>CGU</Text>
      </View>

      <Text style={styles.footerCopyright}>
        © 2024 SecuGuard. Tous droits réservés.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },

  footerLogo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  footerText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text,
    marginBottom: 4,
  },

  footerTagline: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  footerLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  footerSeparator: {
    marginHorizontal: SPACING.sm,
    color: COLORS.textLight,
  },

  footerCopyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
});
