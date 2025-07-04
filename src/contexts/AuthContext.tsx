import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole, Permission, ROLE_PERMISSIONS, Tenant } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  currentTenant: Tenant | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  isRole: (role: UserRole) => boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        setUserProfile(profile);
        
        // Fetch tenant if user has one
        if (profile.tenantId) {
          const tenantDoc = await getDoc(doc(db, 'tenants', profile.tenantId));
          if (tenantDoc.exists()) {
            setCurrentTenant({ id: tenantDoc.id, ...tenantDoc.data() } as Tenant);
          }
        } else {
          setCurrentTenant(null);
        }
        
        return profile;
      } else {
        // Check if this is the first user (super admin)
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
          // First user becomes super admin
          const superAdminProfile: Omit<UserProfile, 'id'> = {
            uid,
            email: currentUser?.email || '',
            name: currentUser?.email?.split('@')[0] || 'Super Admin',
            role: UserRole.SUPER_ADMIN,
            permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
            isActive: true,
            createdAt: new Date() as any,
            updatedAt: new Date() as any
          };
          
          await setDoc(doc(db, 'users', uid), superAdminProfile);
          setUserProfile({ id: uid, ...superAdminProfile });
          setCurrentTenant(null);
          return { id: uid, ...superAdminProfile };
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(result.user.uid);
  };

  const register = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    const newUserProfile: Omit<UserProfile, 'id'> = {
      uid: result.user.uid,
      email,
      name: userData.name || email.split('@')[0],
      role: userData.role || UserRole.EMPLOYEE,
      tenantId: userData.tenantId,
      permissions: userData.permissions || ROLE_PERMISSIONS[userData.role || UserRole.EMPLOYEE],
      isActive: true,
      createdBy: userData.createdBy,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };
    
    await setDoc(doc(db, 'users', result.user.uid), newUserProfile);
    setUserProfile({ id: result.user.uid, ...newUserProfile });
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentTenant(null);
  };

  const hasPermission = (permission: Permission): boolean => {
    return userProfile?.permissions.includes(permission) || false;
  };

  const isRole = (role: UserRole): boolean => {
    return userProfile?.role === role;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
        setCurrentTenant(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    currentTenant,
    login,
    register,
    logout,
    loading,
    hasPermission,
    isRole,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};