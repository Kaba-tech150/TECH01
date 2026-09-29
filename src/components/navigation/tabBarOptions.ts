import { COLORS, FONT_FAMILIES, FONT_SIZES, HAIRLINE_SOFT, SHADOWS } from '@/constants';

/**
 * Options de barre d'onglets communes aux quatre espaces de rôle.
 *
 * POURQUOI UN MODULE PARTAGÉ
 *
 * Les quatre groupes — client, agent, société, administrateur — ont le même
 * gabarit d'onglets : mêmes teintes, même poids de libellé, même filet neutre,
 * même ombre. Seules les icônes changent. Dupliquer ces options dans les
 * quatre layouts avait produit trois versions divergentes : les espaces agent,
 * société et administrateur étaient restés sur des emojis, sans le style de
 * libellé ni l'ombre des onglets.
 *
 * `screenOptions` n'est volontairement pas typé ici : le typer exigerait
 * d'importer `@react-navigation/bottom-tabs`, qui n'est pas une dépendance
 * directe du projet. L'inférence de TypeScript suffit, et `expo-router`
 * continuera de valider l'usage côté layout.
 *
 * CHOIX DES TEINTES
 *
 * `color` est fourni par React Navigation : la teinte active suit
 * `tabBarActiveTintColor`. On retient `primary` (noir) et non l'ambre : un
 * libellé de 10px en ambre sur fond clair plafonne sous le seuil de lisibilité.
 * L'ambre ne sert qu'aux pips et aux liserés d'état actif.
 */
export const TAB_BAR_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textLight,
  tabBarLabelStyle: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
  },
  tabBarStyle: {
    backgroundColor: COLORS.background,
    borderTopColor: HAIRLINE_SOFT,
    ...SHADOWS.header,
  },
} as const;

/**
 * Jeu d'icônes de la barre d'onglets.
 *
 * Icônes Material Community, comme sur l'espace client déjà migré. La
 * correspondance avec les emojis retirés est celle de la maquette :
 *   🏠 accueil      -> home-outline
 *   📋 missions     -> clipboard-text-outline
 *   👤 profil       -> account-outline
 *   👥 équipe       -> account-group-outline
 *   📅 disponibilités-> calendar-clock-outline
 *
 * `clipboard-text-outline` et non `radar` : l'icône « radar » de la maquette
 * est un glyphe Material Symbols, absent du jeu d'icônes Vector embarqué avec
 * l'application. Une icône absente se rendrait en carré vide.
 */
export const TAB_ICONS = {
  accueil: 'home-outline',
  missions: 'clipboard-text-outline',
  profil: 'account-outline',
  recherche: 'magnify',
  equipe: 'account-group-outline',
  utilisateurs: 'account-multiple-outline',
  disponibilites: 'calendar-clock-outline',
} as const;

/** Type du jeu d'icônes, pour que chaque layout déclare son propre subset. */
export type TabIconName = (typeof TAB_ICONS)[keyof typeof TAB_ICONS];
