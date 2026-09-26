import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toUserFacingError } from '@/lib/supabase/errors';
import type { Profile, UserRole } from '@/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface UserAuthData {
  profile: Profile;
  roles: UserRole[];
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  error: Error | null;
  /**
   * Vrai quand `error` provient de la configuration du serveur (droits RLS,
   * table absente) et non d'une action de l'utilisateur. Permet à l'interface
   * de proposer « réessayer » plutôt qu'une correction côté utilisateur.
   */
  isServiceIssue: boolean;
  hasRole: (role: UserRole) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Traduit une erreur technique en `Error` affichable.
 *
 * Le message technique d'origine est conservé sur l'erreur sous le nom
 * `technicalDetail` : il alimente les journaux de développement sans jamais
 * être affiché. C'est la correction du défaut qui exposait
 * « permission denied for schema public » dans l'interface.
 */
function toDisplayError(
  error: unknown,
  fallbackMessage: string,
): Error & { technicalDetail: string } {
  const described = toUserFacingError(error, fallbackMessage);
  const displayError = new Error(described.message) as Error & {
    technicalDetail: string;
  };
  displayError.technicalDetail = described.technical;
  return displayError;
}

async function fetchUserAuthData(userId: string): Promise<UserAuthData> {
  const [profileResult, roleAssignmentsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_roles').select('role').eq('profile_id', userId),
  ]);

  if (profileResult.error) {
    throw toDisplayError(profileResult.error, 'Impossible de charger le profil.');
  }

  if (roleAssignmentsResult.error) {
    throw toDisplayError(roleAssignmentsResult.error, 'Impossible de charger les rôles.');
  }

  if (!profileResult.data) {
    throw new Error(
      'Votre profil est introuvable. Contactez le support si le problème persiste.',
    );
  }

  const assignedRoles = roleAssignmentsResult.data.map(({ role }) => role);
  const roles = Array.from(new Set<UserRole>([profileResult.data.role, ...assignedRoles]));

  return {
    profile: profileResult.data,
    roles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isServiceIssue, setIsServiceIssue] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);
  const authDataRequestRef = useRef(0);

  const clearUserData = useCallback(() => {
    authDataRequestRef.current += 1;
    currentUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
    setError(null);
    setIsServiceIssue(false);
    setLoading(false);
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const requestId = ++authDataRequestRef.current;
    setLoading(true);
    setError(null);
    setIsServiceIssue(false);

    try {
      const authData = await fetchUserAuthData(userId);

      if (requestId !== authDataRequestRef.current) {
        return;
      }

      setProfile(authData.profile);
      setRoles(authData.roles);
    } catch (caughtError) {
      if (requestId !== authDataRequestRef.current) {
        return;
      }

      setProfile(null);
      setRoles([]);
      setIsServiceIssue(toUserFacingError(caughtError).isServiceIssue);
      setError(
        toDisplayError(caughtError, 'Impossible de vérifier vos droits d’accès.'),
      );
    } finally {
      if (requestId === authDataRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let pendingSync: ReturnType<typeof setTimeout> | null = null;

    const applySession = (nextSession: Session | null, forceProfileReload = false) => {
      if (!isMounted) {
        return;
      }

      const nextUser = nextSession?.user ?? null;
      const userChanged = currentUserIdRef.current !== nextUser?.id;

      currentUserIdRef.current = nextUser?.id ?? null;
      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser) {
        clearUserData();
        return;
      }

      if (userChanged || forceProfileReload) {
        void loadUserData(nextUser.id);
      }
    };

    const scheduleSessionSync = (
      nextSession: Session | null,
      forceProfileReload = false,
    ) => {
      if (pendingSync) {
        clearTimeout(pendingSync);
      }

      pendingSync = setTimeout(() => {
        applySession(nextSession, forceProfileReload);
      }, 0);
    };

    const initializeSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        clearUserData();
        setError(toDisplayError(sessionError, 'Impossible de restaurer la session.'));
        return;
      }

      applySession(data.session);
    };

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        return;
      }

      scheduleSessionSync(
        nextSession,
        event === 'SIGNED_IN' || event === 'USER_UPDATED',
      );
    });

    void initializeSession();

    return () => {
      isMounted = false;
      authDataRequestRef.current += 1;

      if (pendingSync) {
        clearTimeout(pendingSync);
      }

      data.subscription.unsubscribe();
    };
  }, [clearUserData, loadUserData]);

  const hasRole = useCallback(
    (role: UserRole) => roles.includes(role),
    [roles],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      clearUserData();
      return;
    }

    await loadUserData(user.id);
  }, [clearUserData, loadUserData, user]);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      throw toDisplayError(signOutError, 'Impossible de se déconnecter.');
    }

    clearUserData();
  }, [clearUserData]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        roles,
        loading,
        error,
        isServiceIssue,
        hasRole,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
