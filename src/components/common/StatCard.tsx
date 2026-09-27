import { View, Text, StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

export function StatCard({ title, value, subtitle, icon, variant = 'primary' }: StatCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { backgroundColor: '#D1FAE5', iconColor: COLORS.success, textColor: COLORS.success };
      case 'warning':
        return { backgroundColor: '#FEF3C7', iconColor: COLORS.warning, textColor: COLORS.warning };
      case 'info':
        return { backgroundColor: COLORS.primaryLight, iconColor: COLORS.primary, textColor: COLORS.primary };
      default:
        return { backgroundColor: COLORS.backgroundSecondary, iconColor: COLORS.primary, textColor: COLORS.text };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <View style={[styles.statCard, { backgroundColor: variantStyle.backgroundColor }]}>
      {Boolean(icon) && (
        <View style={[styles.iconContainer, { backgroundColor: variantStyle.iconColor + '20' }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: variantStyle.textColor }]}>{title}</Text>
        <Text style={[styles.value, { color: variantStyle.textColor }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  icon: {
    fontSize: 24,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.medium,
    marginBottom: 4,
  },

  value: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONT_FAMILIES.display,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
