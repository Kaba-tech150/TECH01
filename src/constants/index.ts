import type { AssignmentStatus, MissionStatus, ProviderStatus } from '@/types';

/*
 * Tokens issus de `design/stitch_secuguard_security_marketplace/*` — identité
 * « SecuGuard Enterprise », relevés sur le `tailwind.config` embarqué dans
 * chaque maquette.
 *
 * LORSQUE LE DESIGN.MD ET LES MAQUETTES DIVERGENT, LA MAQUETTE L'EMPORTE.
 *
 * `design/DESIGN.md` se contredit sur deux points : son bloc YAML déclare
 * `primary: #000000` et `secondary: #515f74`, tandis que le texte en dessous
 * annonce « Primary #0F172A » et « Accent #F59E0B ». Aucune des deux valeurs
 * n'apparaît dans les rendus. Ce fichier suit les PNG et le HTML, qui sont
 * cohérents entre eux : noir plein pour les actions, navy `#131b2e` pour les
 * conteneurs, ambre pour les accents de sécurité.
 */
export const COLORS = {
  /* --- Surfaces (strates claires, du fond vers le plan élevé) --- */
  background: '#FCF8FA', // surface
  backgroundSecondary: '#F6F3F5', // surface-container-low
  surfaceContainer: '#F0EDEF',
  surfaceContainerHigh: '#EAE7E9',
  surfaceContainerHighest: '#E4E2E4',
  surfaceContainerLowest: '#FFFFFF',
  surfaceDim: '#DCD9DB',
  /** Texte posé sur un aplat navy (`primaryContainer`). */
  onNavy: '#F3F0F2', // inverse-on-surface

  /* --- Marque --- */
  /**
   * Noir plein. C'est la couleur des actions de la maquette : « Créer un
   * compte », « Se connecter », « Confirmer l'accès sécurisé ».
   */
  primary: '#000000',
  onPrimary: '#FFFFFF',
  /** Navy des cartes de surveillance (splash, poste de garde, solde agent). */
  primaryContainer: '#131B2E',
  onPrimaryContainer: '#7C839B',
  primaryDark: '#131B2E',
  primaryLight: '#DAE2FD', // primary-fixed

  secondary: '#515F74',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D5E3FD',
  /** Texte posé sur un aplat `secondaryContainer` : le ruban CNAPS du splash. */
  onSecondaryContainer: '#57657B',

  /**
   * Ambre vif : les points d'état actifs, les liserés d'élément sélectionné et
   * les astérisques d'étoiles. Valeur citée en clair par le DESIGN.md.
   */
  accent: '#F59E0B',
  /** Ambre pâli : aplats (badge ENTREPRISE, bouton de virement, étoiles). */
  accentSurface: '#FCDEB5',
  accentSurfaceDim: '#DEC29A',
  /** Texte posé sur un aplat ambre. */
  onAccent: '#271901',
  onWhite: '#FFFFFF',

  /* --- Texte --- */
  text: '#1B1B1D', // on-surface
  textSecondary: '#45464D', // on-surface-variant
  textLight: '#76777D', // outline
  border: '#C6C6CD', // outline-variant
  borderStrong: '#76777D',

  /* --- États --- */
  /** Le design system ne définit aucun vert : valeur choisie dans sa famille. */
  success: '#1F6F45',
  successSurface: '#D8EFE3',
  error: '#BA1A1A',
  errorSurface: '#FFDAD6', // error-container
  onErrorContainer: '#93000A',
  /** Fond de l'action d'urgence : même rouge, à 8% pour ne pas crier. */
  errorSoft: 'rgba(186, 26, 26, 0.08)',
  /** Le bandeau SOS de la maquette est le seul aplat rouge saturé. */
  dangerSolid: '#B3261E',
  warning: '#B45309',
  warningSurface: '#FCDEB5',
  info: '#515F74',

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

/*
 * Échelle de rayons relevée sur le `borderRadius` du `tailwind.config` :
 * DEFAULT 0.25rem, `lg` 0.5rem, `xl` 0.75rem, `full`. Les boutons et les
 * cartes de la maquette sont en `rounded-xl`, donc 12px — c'est `lg` ici.
 */
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Tailles relevées sur le `fontSize` du `tailwind.config`.
 *
 * Le plafond du design est `headline-lg` à 32px : `huge` descend donc de 40 à
 * 32. Aucun écran de la maquette n'emploie de titre plus grand.
 */
export const FONT_SIZES = {
  xs: 10, // label-sm
  sm: 12, // body-sm / label-md
  md: 14, // body-md
  lg: 16, // body-lg
  xl: 18, // headline-sm
  xxl: 21,
  xxxl: 24, // headline-md
  huge: 32, // headline-lg
} as const;

/**
 * Familles chargées dans `src/app/_layout.tsx`.
 *
 * LA PAIRE EST INVERSÉE PAR RAPPORT À L'IDENTITÉ PRÉCÉDENTE.
 *
 * Hanken Grotesk pour tout ce qui est titre, libellé ou bouton — donc 600 et
 * 700 — et Plus Jakarta Sans pour le texte courant, en 400 et 500. Avant,
 * Manrope portait le corps et Plus Jakarta les titres.
 *
 * Les poids sont désignés par un nom de fichier et non par `fontWeight`, car
 * sous Android `fontWeight` seul ne sélectionne pas la bonne fonte une fois
 * une famille personnalisée enregistrée.
 */
export const FONT_FAMILIES = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  extrabold: 'HankenGrotesk_700Bold',
  displaySemibold: 'HankenGrotesk_600SemiBold',
  displayBold: 'HankenGrotesk_700Bold',
  display: 'HankenGrotesk_700Bold',
} as const;

export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '700',
} as const;

/**
 * Ombres neutres et basses.
 *
 * « Depth is conveyed through low-contrast outlines and tonal layering rather
 * than heavy drop shadows » (DESIGN.md). Les anciennes ombres étaient teintées
 * cyan et cobalt : il n'y a plus de couleur dans l'ombre, seulement du gris.
 */
export const SHADOWS = {
  card: {
    shadowColor: '#1B1B1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1B1B1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    shadowColor: '#1B1B1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

/**
 * Liseré 1px des cartes.
 *
 * Sur la maquette, une carte est un aplat blanc `#FFFFFF` posé sur un fond
 * `#FCF8FA` : le contraste n'est que de 2% de luminance, et c'est le liseré
 * `#C6C6CD` qui la détache du fond. Sans lui, deux cartes blanches adjacentes
 * formeraient un seul aplat.
 */
export const HAIRLINE = 'rgba(198, 198, 205, 0.7)';

/**
 * Variante atténuée, réservée à la bordure supérieure de la barre d'onglets.
 *
 * La bordure d'onglets traverse toute la largeur de l'écran : à l'opacité du
 * liseré de carte, elle dessinerait une ligne trop présente en bas de chaque
 * page. D'où cette valeur distincte, et non une couleur en dur dans le layout.
 */
export const HAIRLINE_SOFT = 'rgba(198, 198, 205, 0.45)';

/** Liseré ambre : signature des éléments « en cours » et des états actifs. */
export const HAIRLINE_ACCENT = 'rgba(245, 158, 11, 0.55)';

/** Marge horizontale des écrans : `px-gutter` de la maquette, soit 1.5rem. */
export const SCREEN_PADDING = 24;

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

/**
 * Libellé lisible d'un statut d'affectation.
 *
 * `pending` est « En attente de réponse » et non « En attente » : la formule
 * courte ne dit pas de QUELLE réponse on attend. Or l'attente est celle du
 * prestataire, qui n'a pas encore répondu.
 *
 * Le client et l'agent lisent le MÊME libellé. Un statut affiché différemment
 * selon qui regarde est une source de litiges : « vous aviez dit en attente »,
 * alors que les deux voyaient la même ligne.
 */
export const ASSIGNMENT_STATUS_LABELS = {
  pending: 'En attente de réponse',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  completed: 'Terminée',
} as const satisfies Record<AssignmentStatus, string>;

/**
 * Couleur d'un badge selon le statut d'une affectation.
 *
 * `rejected` est en `error` et non en `warning` : un refus est une décision,
 * pas un retard. L'inverse donnerait au prestataire l'impression qu'il peut
 * encore répondre.
 */
export const ASSIGNMENT_STATUS_VARIANTS = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  completed: 'primary',
} as const satisfies Record<
  AssignmentStatus,
  'primary' | 'success' | 'warning' | 'error'
>;

/**
 * Libellé lisible d'un statut de prestataire.
 *
 * `provider_status` est un `TEXT` à sept valeurs, et non un statut d'avance ou
 * de retard. Le libellé dit donc OÙ EN EST LA VALIDATION, pas ce que l'agent ou
 * la société font.
 *
 * `registered` est « Enregistré » et non « Non validé » : un compte fraichement
 * créé n'a rien contre lui, il n'a pas encore été instruit. `documents_submitted`
 * se dit « Pièces déposées », ce qui décrit un fait et non un refus d'attente.
 */
export const PROVIDER_STATUS_LABELS = {
  registered: 'Enregistré',
  documents_submitted: 'Pièces déposées',
  in_validation: 'En cours de validation',
  validated: 'Validé',
  rejected: 'Refusé',
  active: 'Actif',
  suspended: 'Suspendu',
} as const satisfies Record<ProviderStatus, string>;

/**
 * Variante de badge selon le statut d'un prestataire.
 *
 * `suspended` est en `error` comme `rejected` : dans les deux cas, le compte ne
 * peut pas travailler, et l'ambre de `warning` laisserait croire à un simple
 * retard. `validated` et `active` sont les deux seuls `success`.
 */
export const PROVIDER_STATUS_VARIANTS = {
  registered: 'neutral',
  documents_submitted: 'primary',
  in_validation: 'warning',
  validated: 'success',
  rejected: 'error',
  active: 'success',
  suspended: 'error',
} as const satisfies Record<
  ProviderStatus,
  'primary' | 'success' | 'warning' | 'error' | 'neutral'
>;

