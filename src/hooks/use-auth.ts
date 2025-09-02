
'use client'

import { createContext, useContext } from 'react';
import type { User, Auth } from 'firebase/auth';
import { useFirebase } from './use-firebase';

interface AuthContextType {
  user: User | null;
  auth: Auth | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, auth: null, loading: true });

export const useAuth = () => {
    const firebase = useFirebase();
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    // Combine context with the singleton auth instance from useFirebase
    return {
        ...context,
        auth: firebase.auth
    };
};
