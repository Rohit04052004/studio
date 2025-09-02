
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile } from '@/types';
import { useAuth } from './use-auth';
import { getUserProfileAction } from '@/app/actions';

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
}

export const ProfileContext = createContext<ProfileContextType>({ profile: null, loading: true });

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        setLoading(true);
        const result = await getUserProfileAction(user.uid);
        if (result.success && result.profile) {
          setProfile(result.profile);
        } else {
          // Handle error or no profile case
          setProfile(null);
        }
        setLoading(false);
      } else {
        // No user, so no profile
        setProfile(null);
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  return (
    <ProfileContext.Provider value={{ profile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
