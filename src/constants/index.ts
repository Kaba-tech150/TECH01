import type { MissionStatus } from '@/types';

/*
 * Tokens issus de `design/DESIGN.md` (export des variables Figma).
 *
 * Correspondance volontaire avec le Color Scheme Material 3 de la maquette,
 * et non avec l'ancienne identité bleue : ce fichier est la source de vérité
 * unique, les primitives de `src/components/ui` le consomment.
 */
export const COLORS = {
  /* --- Surfaces (strates claires, du fond vers le plan élevé) --- */
  background: '#FAFAFF', // surface
  backgroundSecondary: '#F3F2FF', // surface-container-low
  surfaceContainer: '#EBEDFF', // surface-container
  surfaceContainerHigh: '#E3E7FF', // surface-container-high
  surfaceContainerHighest: '#DCE1FF', // surface-container-highest
  surfaceContainerLowest: '#FFFFFF',

  /* --- Marque --- */
  primary: '#00677F', // rôle `primary` : lisible en texte et en bordure
  primaryDark: '#004E60',
  primaryLight: '#E3E7FF',
  secondary: '#004AD1',
  cobalt: '#1D63FF',

  /**
   * Cyan lumineux : réservé aux APLATS (boutons d'action, liserés, pips).
   *
   * En texte sur fond clair il plafonne à 1,8:1 de contraste : l'utiliser
   * comme couleur de texte produirait un écran illisible en extérieur.
   * Sur un aplat cyan, la couleur de texte est `onCyan` (4,6:1).
   */
  cyan: '#00D2FF',
  onCyan: '#00566A',
  onWhite: '#FFFFFF',

  /* --- Texte --- */
  text: '#00164E', // on-surface
  textSecondary: '#3C494E', // on-surface-variant
  textLight: '#6C797F', // outline
  border: '#BBC9CF', // outline-variant
  borderStrong: '#6C797F',

  /* --- États --- */
  success: '#00C853',
  error: '#BA1A1A',
  /** Fond de l'action d'urgence : même rouge, à 8% pour ne pas crier. */
  errorSoft: 'rgba(186, 26, 26, 0.08)',
  warning: '#F39C12',
  info: '#1D63FF',

  /**
   * Voile de modale : assombrit la page derrière une feuille ascendante.
   *
   * Noir et non la teinte de texte, pour ne pas teinter le fond d'origine.
   */
  scrim: 'rgba(17, 24, 39, 0.5)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 21,
  xxxl: 24,
  huge: 40,
} as const;

/**
 * Familles chargées dans `src/app/_layout.tsx`.
 *
 * Manrope pour le texte courant, Plus Jakarta Sans pour les titres : c'est la
 * paire de la maquette. Les poids sont désignés par un nom de fichier et non
 * par `fontWeight`, car sous Android `fontWeight` seul ne sélectionne pas la
 * bonne fonte une fois une famille personnalisée enregistrée.
 */
export const FONT_FAMILIES = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  displaySemibold: 'PlusJakartaSans_600SemiBold',
  displayBold: 'PlusJakartaSans_700Bold',
  display: 'PlusJakartaSans_800ExtraBold',
} as const;

export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Halos de la maquette. React Native n'expose pas les ombres CSS en couches,
 * chaque niveau est donc rendu par un `shadowColor` unique : cyan au niveau
 * carte, cobalt au niveau élevé. Sur Android seul `elevation` est lu, d'où
 * les valeurs légèrement différentes — l'effet reste proche.
 */
export const SHADOWS = {
  card: {
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 3,
  },
  raised: {
    shadowColor: '#1D63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 6,
  },
  header: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

/** Liseré cyan 1px : signature visuelle de la marque sur les cartes. */
export const HAIRLINE_CYAN = 'rgba(0, 210, 255, 0.28)';

/**
 * Variante atténuée, réservée à la bordure supérieure de la barre d'onglets.
 *
 * La bordure d'onglets traverse toute la largeur de l'écran : à l'opacité du
 * liseré de carte, elle dessinerait une ligne trop présente en bas de chaque
 * page. D'où cette valeur distincte, et non une couleur en dur dans le layout.
 */
export const HAIRLINE_CYAN_SOFT = 'rgba(0, 210, 255, 0.18)';

export const HAIRLINE_COBALT = 'rgba(29, 99, 255, 0.25)';

export const SCREEN_PADDING = 20;

export const API_TIMEOUT = 30000;

export const MISSION_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  PAID: 'paid',
} as const;

export const MISSION_STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publiée',
  accepted: 'Acceptée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  disputed: 'Litige',
  paid: 'Payée',
} as const satisfies Record<MissionStatus, string>;

/**
 * Couleur d'un badge selon le statut de la mission.
 *
 * `draft` et `cancelled` sont distingués de `disputed` : une mission annulée
 * est un état normal du cycle de vie, un litige est une anomalie qui doit
 * sauter aux yeux. Les regrouper en `error` serait trompeur.
 */
export const MISSION_STATUS_VARIANTS = {
  draft: 'warning',
  published: 'primary',
  accepted: 'primary',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
  disputed: 'error',
  paid: 'success',
} as const satisfies Record<MissionStatus, 'primary' | 'success' | 'warning' | 'error'>;

/** Statuts dans lesquels le client peut encore modifier ou publier sa mission. */
export const EDITABLE_MISSION_STATUSES: readonly MissionStatus[] = ['draft'];

export const USER_ROLES = {
  CLIENT: 'client',
  AGENT: 'agent',
  COMPANY: 'company',
  ADMIN: 'admin',
} as const;

export const PROVIDER_STATUSES = {
  REGISTERED: 'registered',
  DOCUMENTS_SUBMITTED: 'documents_submitted',
  IN_VALIDATION: 'in_validation',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;
