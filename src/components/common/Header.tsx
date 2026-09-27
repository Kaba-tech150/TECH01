import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';

interface HeaderProps {
  onLoginPress?: () => void;
  showLogin?: boolean;
}

export function Header({ onLoginPress, showLogin = true }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <View style={styles.logoInner}>
            <Text style={styles.logoIconText}>S</Text>
          </View>
        </View>

        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>SecuGuard</Text>
          <Text style={styles.logoSubtitle}>Gardiennage & Sécurité</Text>
        </View>
      </View>

      {showLogin && (
        <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
          <Text style={styles.loginText}>Connexion</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  logoInner: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoIconText: {
    color: COLORS.background,
    fontSize: 24,
    fontFamily: FONT_FAMILIES.display,
  },

  logoTextContainer: {
    flexDirection: 'column',
  },

  logoText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONT_FAMILIES.display,
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  logoSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  loginButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'transparent',
  },

  loginText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
  },
});
