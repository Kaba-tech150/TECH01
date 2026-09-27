import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';

interface StepProps {
  number: number;
  title: string;
  description: string;
}

export function Step({ number, title, description }: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.lg,
  },

  stepNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  stepNumberText: {
    color: COLORS.background,
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.lg,
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILIES.displayBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  stepDescription: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
});
