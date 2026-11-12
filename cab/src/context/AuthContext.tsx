import React, {createContext, useCallback, useContext, useEffect, useState, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types/navigation';
import Api from '../config/Api';

export type AccountStatus = 'active' | 'inactive' | 'blocked';

export interface UserProfileData {
  name: string;
  phone: string;
  email: string;
}

export interface DriverProfileData extends UserProfileData {
  vehicleType: string;
  vehicleModel: string;
  vehicleNumber: string;
  licenseNumber: string;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isReady: boolean;
  role: UserRole;
  accountStatus: AccountStatus;
  user: UserProfileData;
  driver: DriverProfileData;
  signIn: (token: string, profile: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  setDriverOnline: (online: boolean) => void;
  updateUserProfile: (data: Partial<UserProfileData>) => void;
  updateDriverProfile: (data: Partial<DriverProfileData>) => void;
}

const defaultUser: UserProfileData = {
  name: '',
  phone: '',
  email: '',
};

const defaultDriver: DriverProfileData = {
  name: '',
  phone: '',
  email: '',
  vehicleType: '',
  vehicleModel: '',
  vehicleNumber: '',
  licenseNumber: '',
  isOnline: false,
  rating: 0,
  totalTrips: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [role, setRoleState] = useState<UserRole>('user');
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('active');
  const [user, setUser] = useState<UserProfileData>(defaultUser);
  const [driver, setDriver] = useState<DriverProfileData>(defaultDriver);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await AsyncStorage.getMany(['accessToken', 'user']);
        if (saved.accessToken && saved.user) {
          const profile = JSON.parse(saved.user);
          let currentProfile = profile;
          try {
            const response = await Api.get('/auth/me');
            currentProfile = response.data;
          } catch (error: any) {
            if (error.response?.status === 401) {
              await AsyncStorage.removeMany(['accessToken', 'user']);
              return;
            }
            console.warn('Could not refresh account status:', error);
          }
          const currentRole = currentProfile.role === 'driver' ? 'driver' : 'user';
          setAccountStatus(
            currentProfile.status === 'blocked' || currentProfile.status === 'inactive'
              ? currentProfile.status
              : 'active',
          );
          setRoleState(currentRole);
          if (currentRole === 'driver') {
            setDriver(previous => ({...previous, name: currentProfile.name || previous.name, phone: currentProfile.phone || previous.phone}));
          } else {
            setUser(previous => ({...previous, name: currentProfile.name || previous.name, phone: currentProfile.phone || previous.phone, email: currentProfile.email || ''}));
          }
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.warn('Could not restore the saved session:', error);
        await AsyncStorage.removeMany(['accessToken', 'user']);
      } finally {
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const refreshStatus = async () => {
      try {
        const response = await Api.get('/auth/me');
        const profile = response.data;
        setAccountStatus(
          profile.status === 'blocked' || profile.status === 'inactive'
            ? profile.status
            : 'active',
        );
        if (profile.role === 'driver') {
          setDriver(previous => ({...previous, name: profile.name || previous.name, phone: profile.phone || previous.phone}));
        } else {
          setUser(previous => ({...previous, name: profile.name || previous.name, phone: profile.phone || previous.phone, email: profile.email || ''}));
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          await AsyncStorage.removeMany(['accessToken', 'user']);
          setIsLoggedIn(false);
          setAccountStatus('active');
          return;
        }
        console.warn('Could not refresh account status:', error);
      }
    };
    const timer = setInterval(refreshStatus, 10_000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  const signIn = useCallback(async (token: string, profile: Record<string, unknown>) => {
    const loginRole: UserRole = profile.role === 'driver' ? 'driver' : 'user';
    await AsyncStorage.setMany({
      accessToken: token,
      user: JSON.stringify(profile),
    });
    setAccountStatus(
      profile.status === 'blocked' || profile.status === 'inactive'
        ? profile.status
        : 'active',
    );
    setRoleState(loginRole);
    if (loginRole === 'driver') {
      setDriver(previous => ({...previous, name: String(profile.name || ''), phone: String(profile.phone || '')}));
    } else {
      setUser(previous => ({...previous, name: String(profile.name || ''), phone: String(profile.phone || ''), email: String(profile.email || '')}));
    }
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeMany(['accessToken', 'user']);
    setIsLoggedIn(false);
    setAccountStatus('active');
  }, []);

  const setDriverOnline = useCallback((online: boolean) => {
    setDriver(prev => ({...prev, isOnline: online}));
  }, []);

  const updateUserProfile = useCallback((data: Partial<UserProfileData>) => {
    setUser(prev => ({ ...prev, ...data }));
  }, []);

  const updateDriverProfile = useCallback((data: Partial<DriverProfileData>) => {
    setDriver(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isReady,
        role,
        accountStatus,
        user,
        driver,
        signIn,
        logout,
        setDriverOnline,
        updateUserProfile,
        updateDriverProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
