import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  SPACING,
} from '@/constants';

export type BandeauNavyAction = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  /** Libellé lu par le lecteur d'écran à la place du libellé visible. */
  accessibilityLabel?: string;
};

interface BandeauNavyProps {
  /** Sur-titre court, précédé du point d'état : « DÉPLOIEMENT RAPIDE ». */
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Touche principale, en bas du bandeau. */
  primaryAction: BandeauNavyAction;
  /** Touche icône secondaire, à droite de la principale. */
  secondaryAction?: BandeauNavyAction;
  /**
   * Affiche le point d'état ambré.
   *
   * `false` quand le bandeau décrit un état inactif — une carte de portefeuille
   * d'un compte sans solde n'est pas « en cours ».
   */
  pulsante?: boolean;
}

/**
 * Bandeau navy de tête des tableaux de bord.
 *
 * `primaryContainer` est la seule surface navy du design, et elle apparaît sur
 * quatre maquettes. La dupliquer par écran produirait quatre jeux de styles
 * qui divergeraient au premier ajustement — exactement le défaut que la
 * factorisation des primitives du lot 1 corrigait.
 *
 * Le fond est posé sur `COLORS.primaryContainer` et le texte sur `onWhite` :
 * la maquette écrit `text-on-primary`, ce qui vaut `#FFFFFF` dans sa palette.
 */
export function BandeauNavy({
  eyebrow,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  pulsante = true,
}: BandeauNavyProps) {
  return (
    <View style={styles.base}>
      <View style={styles.haut}>
        <View style={styles.copie}>
          <View style={styles.pipLigne}>
            {pulsante ? <View style={styles.pip} /> : null}
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>

          <Text style={styles.titre} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        </View>

        <View style={styles.icone}>
          <MaterialCommunityIcons name={icon} size={28} color={COLORS.secondaryContainer} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={primaryAction.onPress}
          accessibilityRole="button"
          accessibilityLabel={primaryAction.accessibilityLabel ?? primaryAction.label}
          style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
        >
          <MaterialCommunityIcons
            name={primaryAction.icon}
            size={18}
            color={COLORS.text}
          />
          <Text style={styles.boutonTexte} numberOfLines={1}>
            {primaryAction.label}
          </Text>
        </Pressable>

        {secondaryAction ? (
          <Pressable
            onPress={secondaryAction.onPress}
            accessibilityRole="button"
            accessibilityLabel={
              secondaryAction.accessibilityLabel ?? secondaryAction.label
            }
            style={({ pressed }) => [styles.boutonIcone, pressed && styles.presse]}
          >
            <MaterialCommunityIcons
              name={secondaryAction.icon}
              size={20}
              color={COLORS.onWhite}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    gap: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
  },
  haut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  copie: {
    flex: 1,
    minWidth: 0,
  },
  pipLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.secondaryContainer,
  },
  titre: {
    marginTop: 4,
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xl,
    lineHeight: 24,
    color: COLORS.onWhite,
  },
  description: {
    marginTop: 2,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
    color: COLORS.onPrimaryContainer,
  },
  icone: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    /*
     * Voile blanc à 10 % : la maquette écrit `bg-surface-container-lowest/10`.
     * `rgba` est le seul moyen d'exprimer une opacité sur un aplat sans
     * inventer une huitième teinte de surface dans les tokens.
     */
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  bouton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  boutonTexte: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  boutonIcone: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presse: {
    opacity: 0.85,
  },
});