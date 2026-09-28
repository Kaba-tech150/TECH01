import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Typography } from '@/components/ui';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  SPACING,
} from '@/constants';
import { formatDate } from '@/lib/utils';
import type { PrestataireRef } from '@/services';
import type { AssignmentStatus } from '@/types';

export type CarteAffectationProps = {
  status: AssignmentStatus;
  createdAt: string;
  /**
   * Identifiant métier du prestataire — `agent_id` ou `company_id`.
   *
   * TOUJOURS REQUIS, même quand le nom est disponible : c'est lui qui permet
   * d'affiner `useNomsPrestataires`, et c'est le seul repli honnête quand la
   * fonction de nommage est absente du catalogue.
   */
  prestataireId: string;
  /**
   * Prestataire affecté, s'il a pu être nommé.
   *
   * FACULTATIF, ET CE N'EST PAS DE LA LAISSE : la fonction
   * `public.prestataires_par_ids` peut être absente, et son absence ne doit pas
   * empêcher d'afficher l'affectation elle-même.
   */
  prestataire?: PrestataireRef;
  /** Présent côté agent, où la mission est imbriquée. */
  titreMission?: string;
  lieu?: string;
  /** Actions : accepter/refuser côté agent, rien côté client. */
  children?: ReactNode;
};

/**
 * Une affectation, affichée de la même façon au client et à l'agent.
 *
 * UN SEUL COMPOSANT POUR LES DEUX ÉCRANS, ET C'EST EXIGÉ.
 *
 * Les deux camps lisent la même ligne, et doivent donc voir le même statut, le
 * même libellé et la même couleur. Deux implémentations parallèles divergeaient
 * au premier changement de libellé — et personne ne l'aurait vu, parce que les
 * deux écrans « fonctionnaient » séparément.
 */
export function CarteAffectation({
  status,
  createdAt,
  prestataireId,
  prestataire,
  titreMission,
  lieu,
  children,
}: CarteAffectationProps) {
  /*
   * SANS NOM, ON AFFICHE L'IDENTIFIANT COURT — ET ON NE FABRIQUE RIEN.
   *
   * Écrire « Prestataire » sans rien ajouter laisserait croire que le nom
   * manque dans la base, alors qu'il manque à l'appel : c'est un défaut de
   * migration, pas de donnée.
   */
  const nom = prestataire
    ? prestataire.nom
    : `Prestataire · ${prestataireId.slice(0, 8)}`;

  return (
    <Card style={styles.carte}>
      <View style={styles.entete}>
        <View style={styles.identite}>
          <Typography variant="h3" numberOfLines={2}>
            {nom}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {prestataire?.kind === 'company'
              ? 'Société de sécurité'
              : 'Agent de sécurité'}
          </Typography>
        </View>
        <Badge
          text={ASSIGNMENT_STATUS_LABELS[status]}
          variant={ASSIGNMENT_STATUS_VARIANTS[status]}
        />
      </View>

      {titreMission ? (
        <Text style={styles.mission} numberOfLines={2}>
          {titreMission}
        </Text>
      ) : null}

      {lieu ? <Text style={styles.lieu}>{lieu}</Text> : null}

      <View style={styles.pied}>
        <Text style={styles.date}>
          Demandée le {formatDate(createdAt, 'short')}
        </Text>
      </View>

      {children ? <View style={styles.actions}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  carte: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  identite: {
    flex: 1,
  },
  mission: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  lieu: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  pied: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  date: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
