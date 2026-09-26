/**
 * Traduction des erreurs techniques en messages comprensibles.
 *
 * POURQUOI CE MODULE EXISTE (2026-09-26)
 * --------------------------------------
 * `AuthContext.toError` recopiait le message brut renvoyé par PostgreSQL, et
 * l'interface affichait donc literalmente :
 *
 *   Accès indisponible
 *   permission denied for schema public
 *
 * Ce texte n'est pas exploitable par un utilisateur final, et il ne dit rien
 * de la cause réelle. Le message technique est désormais conservé pour les
 * journaux et remplacé par une explication dans l'interface.
 *
 * Règle : ne jamais afficher un message provenant du serveur. Le serveur peut
 * révéler l'existence d'une table, d'une politique ou d'un rôle.
 */

/** Message destiné à l'utilisateur final. */
export type UserFacingError = {
  /** Message affichable, en français, sans détail technique. */
  message: string;
  /** Détail technique conservé pour les journaux de développement. */
  technical: string;
  /**
   * Vrai lorsque le problème vient de la configuration du serveur et non de
   * l'utilisateur. L'interface peut alors proposer de réessayer plus tard
   * plutôt que de demander une action.
   */
  isServiceIssue: boolean;
};

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

const GENERIC_SERVICE_MESSAGE =
  'Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.';

const GENERIC_PROFILE_MESSAGE =
  'Impossible de vérifier vos droits d’accès pour le moment.';

/**
 * Extrait un message brut depuis une erreur quelconque, sans jamais lever.
 */
function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const candidate = (error as PostgrestLikeError).message;
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return 'Erreur inconnue';
}

/**
 * Traduit une erreur PostgREST / Auth en message utilisable par un humain.
 *
 * Le classement se fait sur le CODE technique et non sur le texte, car les
 * messages PostgreSQL sont traduits et peuvent varier selon la version.
 */
export function toUserFacingError(
  error: unknown,
  fallbackMessage: string = GENERIC_SERVICE_MESSAGE,
): UserFacingError {
  const technical = extractMessage(error);
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? ((error as PostgrestLikeError).code ?? null)
      : null;

  const lowered = technical.toLowerCase();

  // Erreurs d'authentification : message déjà compréhensible par l'utilisateur.
  if (code === 'invalid_credentials' || lowered.includes('invalid login credentials')) {
    return {
      message: 'Email ou mot de passe incorrect.',
      technical,
      isServiceIssue: false,
    };
  }

  if (code === 'email_not_confirmed' || lowered.includes('email not confirmed')) {
    return {
      message:
        'Votre adresse email n’est pas encore confirmée. Consultez votre boîte de réception pour valider votre compte.',
      technical,
      isServiceIssue: false,
    };
  }

  if (
    code === 'user_already_exists' ||
    lowered.includes('user already registered') ||
    lowered.includes('already been registered')
  ) {
    return {
      message: 'Un compte existe déjà avec cette adresse email. Essayez de vous connecter.',
      technical,
      isServiceIssue: false,
    };
  }

  if (lowered.includes('password should be at least')) {
    return {
      message: 'Le mot de passe doit contenir au moins 6 caractères.',
      technical,
      isServiceIssue: false,
    };
  }

  if (lowered.includes('rate limit') || code === 'over_request_rate_limit') {
    return {
      message: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
      technical,
      isServiceIssue: false,
    };
  }

  // Le trigger de création de profil a échoué côté serveur.
  //
  // C'est le symptôme observé tant que la migration 20260925000700 n'est pas
  // appliquée : `force row level security` soumet les triggers `SECURITY
  // DEFINER` aux politiques, qui n'autorisent pas l'insertion. Supabase masque
  // alors la cause derrière ce message générique, ce qui rend le diagnostic
  // impossible depuis l'interface seule.
  if (
    lowered.includes('database error saving new user') ||
    lowered.includes('row-level security') ||
    lowered.includes('violates row level security')
  ) {
    return {
      message:
        'La création de votre profil a échoué côté serveur. Réessayez dans quelques instants.',
      technical,
      isServiceIssue: true,
    };
  }

  // Problème de droits côté serveur : la configuration RLS est incomplète.
  // C'est le cas observé sur le projet distant.
  if (lowered.includes('permission denied for schema')) {
    return {
      message:
        'Le service est momentanément indisponible. L’équipe technique est en cours de résolution.',
      technical,
      isServiceIssue: true,
    };
  }

  if (lowered.includes('row-level security') || lowered.includes('failed to download')) {
    return {
      message: 'Vous n’avez pas les droits nécessaires pour accéder à ces données.',
      technical,
      isServiceIssue: false,
    };
  }

  // Table ou fonction absente : dérive entre le contrat TypeScript et la base.
  if (code === 'PGRST205' || code === 'PGRST202') {
    return {
      message: GENERIC_SERVICE_MESSAGE,
      technical,
      isServiceIssue: true,
    };
  }

  if (lowered.includes('jwt') || lowered.includes('token') || lowered.includes('session')) {
    return {
      message: 'Votre session a expiré. Veuillez vous reconnecter.',
      technical,
      isServiceIssue: false,
    };
  }

  if (lowered.includes('fetch') || lowered.includes('network') || lowered.includes('timeout')) {
    return {
      message: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
      technical,
      isServiceIssue: true,
    };
  }

  // Erreur d'affichage d'une ligne absente : la requête a bien fonctionné.
  if (code === 'PGRST116') {
    return {
      message: GENERIC_PROFILE_MESSAGE,
      technical,
      isServiceIssue: false,
    };
  }

  return {
    message: fallbackMessage,
    technical,
    isServiceIssue: false,
  };
}

/** Message court utilisable dans un toast ou un bandeau. */
export function describeServiceIssue(error: unknown): string {
  return toUserFacingError(error).message;
}

/**
 * Journalise le détail technique d'une erreur, sans jamais l'afficher.
 *
 * POURQUOI CE N'EXISTAIT PAS (2026-09-26)
 * ---------------------------------------
 * Le premier correctif masquait les messages du serveur dans l'interface, mais
 * ne conservait le détail technique que dans une propriété d'objet jamais
 * lue. Conséquence : un échec d'inscription n'affichait que « Erreur
 * d'inscription », sans aucun moyen de savoir pourquoi. Masquer une
 * information sans.logger la source rend le diagnostic IMPOSSIBLE.
 *
 * Le détail part dans la console du terminal Metro (`npx expo start`), ce qui
 * n'est ni visible par l'utilisateur final, ni exposé sur l'appareil.
 *
 * @param context Origine de l'erreur, pour la repérer dans le journal.
 */
export function logTechnicalError(context: string, error: unknown): void {
  const described = toUserFacingError(error);
  console.warn(
    `[SecuGuard] ${context} — type=${described.isServiceIssue ? 'incident serveur' : 'action utilisateur'} technique=${described.technical}`,
  );
}