import { Badge, Card, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VARIANTS,
  SPACING,
} from '@/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Mission } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

interface MissionCardProps {
  mission: Mission;
}

/**
 * Affiche une mission dans la liste du client.
 *
 * Le budget est affiché seulement s'il est renseigné : afficher « 0,00 € »
 * pour une mission sans budget laisserait croire à un prix, ce qui est faux.
 */
export function MissionCard({ mission }: MissionCardProps) {
  const aBudget = mission.budget !== null && mission.budget !== undefined;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title} numberOfLines={2}>
          {mission.title}
        </Typography>
        <Badge
          text={MISSION_STATUS_LABELS[mission.status]}
          variant={MISSION_STATUS_VARIANTS[mission.status]}
        />
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaItem}>{mission.city}</Text>
        <Text style={styles.separator}>·</Text>
        <Text style={styles.metaItem}>
          {mission.agent_count} agent{mission.agent_count > 1 ? 's' : ''}
        </Text>
        {aBudget ? (
          <>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.metaItem}>{formatCurrency(mission.budget as number)}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.schedule}>
        <Text style={styles.scheduleLabel}>Début</Text>
        <Text style={styles.scheduleValue}>{formatDate(mission.start_time, 'long')}</Text>
      </View>
      <View style={styles.schedule}>
        <Text style={styles.scheduleLabel}>Fin</Text>
        <Text style={styles.scheduleValue}>{formatDate(mission.end_time, 'long')}</Text>
      </View>

      {mission.address ? (
        <Text style={styles.address} numberOfLines={2}>
          {mission.address}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  title: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  separator: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.md,
  },
  schedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scheduleLabel: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.sm,
    width: 48,
  },
  scheduleValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    flex: 1,
  },
  address: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
});