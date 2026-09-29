import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SHADOWS, SPACING } from '@/constants';

interface CatalogueRowProps {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
}

/**
 * Ligne du catalogue de prestations.
 *
 * La maquette ajoute un prix aligné à droite (« 24€ / heure »). IL N'EST PAS
 * REPRIS, et c'est délibéré : `missions.budget` est un montant global saisi par
 * le client, et `agent_profiles.hourly_rate` un tarif propre à chaque
 * prestataire. Aucun tabela n'est une grille tarifaire. Afficher « 24€ » serait
 * inventer un prix que la base ne contient pas — et le rapport du projet a
 * déjà fait le constat inverse sur les statistiques codées en dur.
 *
 * La colonne de droite est donc LIBRE, et l'appelant y place ce qu'il a
 * réellement : `budget` d'une mission, `hourly_rate` d'un prestataire, ou rien.
 */
export function CatalogueRow({ title, description, icon, onPress }: CatalogueRowProps) {
  const contenu = (
    <>
      <View style={styles.icone}>
        <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
      </View>

      <View style={styles.textes}>
        <Text style={styles.titre} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      </View>
    </>
  );

  const styleLigne = [styles.base];

  if (!onPress) {
    return <View style={styleLigne}>{contenu}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [...styleLigne, pressed && styles.pressed]}
    >
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    ...SHADOWS.card,
  },
  pressed: {
    opacity: 0.85,
  },
  icone: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: {
    // `minWidth: 0` autorise `numberOfLines` à tronquer : sans lui, un titre
    // long refuse de rétrécir et pousse la ligne hors de l'écran.
    flex: 1,
    minWidth: 0,
  },
  titre: {
    fontFamily: FONT_FAMILIES.displaySemibold,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
    color: COLORS.text,
  },
  description: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },
});