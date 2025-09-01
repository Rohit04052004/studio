
'use client'

import { createContext, useContext } from 'react';
import type { User, Auth } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  auth: Auth | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, auth: null, loading: true });

export const useAuth = () => useContext(AuthContext);
