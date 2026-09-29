import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  SPACING,
} from '@/constants';

interface LigneReglageProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  /** Contre-libellé : « SMS prioritaire + Clé TOTP active ». */
  subtitle?: string;
  /**
   * Texte à droite : « Configuré », « Français (FR) », « 2 connectés ».
   *
   * AFFICHÉ SEULEMENT SI FOURNI. La maquette distingue troisliners — valeur,
   * badge, chevron — et `undefined` signifie « rien à droite », pas « — ».
   */
  trailing?: string;
  /** Affiche un chevron et rend la ligne actionnable. */
  chevron?: boolean;
  onPress?: () => void;
  /**
   * Affiche la ligne entière en atténué, avec la mention « Non configuré ».
   *
   * C'est le seul cas où l'interface doit dire explicitement qu'une
   * fonctionnalité existe mais n'est pas activée : sans cela, l'absence de
   * ligne se lit comme une absence de fonctionnalité.
   */
  desactive?: boolean;
}

/**
 * Ligne de réglage de l'écran « Profil & Paramètres ».
 *
 * La maquette empile ces lignes dans des cartes blanches séparées par un
 * filet, avec une icône dans un carré. Le composant rend UNE ligne : le
 * découpage en cartes, lui, appartient à l'écran, qui sait quelles lignes
 * partagent un thème.
 *
 * Transverse : elle ne connaît ni la donnée, ni l'effet. Un réglage que
 * l'application ne sait pas encore faire ne doit donc pas être rendu ici — il
 * n'y a pas de place pour « à venir » dans une ligne qui annonce une action.
 */
export function LigneReglage({
  icon,
  title,
  subtitle,
  trailing,
  chevron = false,
  onPress,
  desactive = false,
}: LigneReglageProps) {
  const contenu = (
    <View style={styles.contenu}>
      <View style={[styles.icone, desactive && styles.iconeDesactive]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={desactive ? COLORS.textLight : COLORS.text}
        />
      </View>

      <View style={styles.textes}>
        <Text
          style={[styles.titre, desactive && styles.titreDesactive]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.sousTitre} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? (
        <Text style={styles.valeur} numberOfLines={1}>
          {trailing}
        </Text>
      ) : null}

      {chevron ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={COLORS.textLight}
        />
      ) : null}
    </View>
  );

  /*
   * SANS GESTIONNAIRE, LA LIGNE EST UNE `View`.
   *
   * Une ligne présentée comme un bouton mais insensible est un défaut
   * d'accessibilité : le lecteur d'écran annonce « bouton » et rien ne se passe
   * au toucher. `LigneSetting` suit donc la même règle que `Card` et `Badge`.
   */
  if (!onPress) {
    return <View style={styles.base}>{contenu}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.base, pressed && styles.presse]}
    >
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  contenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  presse: {
    // La maquette change le fond au survol ; en tactile, l'opacité rend le
    // même retour sans introduire d'état de pointeur absent du mobile.
    opacity: 0.7,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeDesactive: {
    backgroundColor: COLORS.surfaceContainer,
  },
  textes: {
    // `minWidth: 0` autorise `numberOfLines` à tronquer : sans lui, un titre
    // long refuse de rétrécir et pousse la valeur hors de l'écran.
    flex: 1,
    minWidth: 0,
  },
  titre: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    lineHeight: 18,
    color: COLORS.text,
  },
  titreDesactive: {
    color: COLORS.textLight,
  },
  sousTitre: {
    marginTop: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },
  valeur: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});