import { StatCard } from '@/components/common';
import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function CompanyIndex() {
  const { profile } = useAuthContext();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>
        Bonjour, {profile?.full_name || 'Société'} 👋
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Bienvenue sur votre espace société
      </Typography>

      <View style={styles.statsGrid}>
        <StatCard
          title="Missions en cours"
          value="0"
          subtitle="Aucune mission active"
          icon="📋"
          variant="primary"
        />
        <StatCard
          title="Agents actifs"
          value="0"
          subtitle="Équipe"
          icon="👥"
          variant="info"
        />
      </View>

      <Card style={styles.card}>
        <Typography variant="h3">Actions rapides</Typography>
        <Button title="Rechercher des missions" onPress={() => {}} style={styles.button} />
        <Button title="Gérer l'équipe" variant="secondary" onPress={() => {}} style={styles.button} />
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
