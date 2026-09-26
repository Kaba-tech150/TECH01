import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(error.message);
  }

  return new Error('Impossible de charger le profil.');
}

export function useProfile(profileId?: string) {
  const {
    user,
    profile: currentProfile,
    loading: currentProfileLoading,
    error: currentProfileError,
  } = useAuthContext();
  const resolvedProfileId = profileId ?? user?.id;
  const usesCurrentProfile = user !== null && resolvedProfileId === user.id;
  const [fetchedProfile, setFetchedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!resolvedProfileId || usesCurrentProfile) {
      return;
    }

    let isActive = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', resolvedProfileId)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (isActive) {
          setFetchedProfile(data);
        }
      } catch (caughtError) {
        if (isActive) {
          setFetchedProfile(null);
          setError(toError(caughtError));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      isActive = false;
    };
  }, [resolvedProfileId, usesCurrentProfile]);

  return {
    profile: usesCurrentProfile ? currentProfile : fetchedProfile,
    loading: usesCurrentProfile ? currentProfileLoading : loading,
    error: usesCurrentProfile ? currentProfileError : error,
  };
}
