import { ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';
import { Typography, Card } from '@/components/ui';

export default function AdminMissions() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Missions</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Supervisez toutes les missions
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Liste des missions</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Bientôt disponible : vue d&apos;ensemble de toutes les missions
        </Typography>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardText: {
    marginTop: SPACING.sm,
  },
});
