import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES } from '@/constants';

export type PuceVariant = 'secondary' | 'neutral';

interface PuceProps {
  label: string;
  variant?: PuceVariant;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /**
   * Pastille ambre à gauche : la signature « élément en cours » du design.
   *
   * La maquette fait pulser ce point (`animate-pulse` / `animate-ping`). Ici il
   * est STATIQUE, et c'est un choix : une animation d'aperçu CSS n'a pas
   * d'équivalent gratuit en React Native — il faudrait un `Animated` en boucle
   * permanente, sur un point de 6 px, pour un effet que l'utilisateur ne
   * remarque pas. Si la pulsation est jugée nécessaire plus tard, elle
   * appartient ici, dans cette primitive, et pas dans chaque écran.
   */
  pulsante?: boolean;
}

/**
 * Pastille de métadonnée.
 *
 * Reproduit les deux pilules de la maquette `secuguard_accueil_client.html` :
 * l'aplat `secondary-container` de « ESPACE DONNEUR D'ORDRE » et l'aplat
 * `surface-container-highest` de « CNAPS #75-9832 ».
 *
 * Transverse par nature : elle ne porte ni donnée métier ni action. C'est un
 * `View`, pas un `Pressable` — une pastille d'information annoncée comme un
 * bouton est un défaut d'accessibilité, alors qu'aucun de ces blocs n'est
 * cliquable.
 */
export function Puce({ label, variant = 'secondary', icon, pulsante }: PuceProps) {
  const secondaire = variant === 'secondary';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: secondaire
            ? COLORS.secondaryContainer
            : COLORS.surfaceContainerHigh,
        },
      ]}
    >
      {pulsante ? <View style={styles.pastille} /> : null}
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={secondaire ? COLORS.onSecondaryContainer : COLORS.textSecondary}
        />
      ) : null}
      <Text
        style={[
          styles.texte,
          { color: secondaire ? COLORS.onSecondaryContainer : COLORS.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  pastille: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  texte: {
    fontFamily: FONT_FAMILIES.semibold,
    // `label-sm` de la maquette : 10px, interlettrage 0.05em.
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});