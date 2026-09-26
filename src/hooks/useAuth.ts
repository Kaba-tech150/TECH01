import { useAuthContext } from '@/context/AuthContext';

export function useAuth() {
  const context = useAuthContext();

  return {
    ...context,
    isAuthenticated: context.user !== null,
  };
}
