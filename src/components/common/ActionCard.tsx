import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SPACING } from '@/constants';

interface ActionCardProps {
  title: string;
  description?: string;
  icon: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ActionCard({ title, description, icon, onPress, variant = 'primary' }: ActionCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: COLORS.backgroundSecondary, borderColor: COLORS.border };
      case 'danger':
        return { backgroundColor: '#FEE2E2', borderColor: COLORS.error };
      default:
        return { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: variantStyle.backgroundColor, borderColor: variantStyle.borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  icon: {
    fontSize: 22,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: 2,
  },

  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  arrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
