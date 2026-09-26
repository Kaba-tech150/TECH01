import { StatCard } from '@/components/common';
import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function AdminIndex() {
  const { profile } = useAuthContext();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>
        Bonjour, {profile?.full_name || 'Admin'} 👋
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Panneau d&apos;administration
      </Typography>

      <View style={styles.statsGrid}>
        <StatCard
          title="Utilisateurs"
          value="0"
          subtitle="En attente de validation"
          icon="👥"
          variant="primary"
        />
        <StatCard
          title="Missions actives"
          value="0"
          subtitle="En cours"
          icon="📋"
          variant="info"
        />
      </View>

      <Card style={styles.card}>
        <Typography variant="h3">Actions rapides</Typography>
        <Button title="Valider les utilisateurs" onPress={() => {}} style={styles.button} />
        <Button title="Superviser les missions" variant="secondary" onPress={() => {}} style={styles.button} />
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
  statsGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  button: {
    marginTop: SPACING.md,
  },
});
