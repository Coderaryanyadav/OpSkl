import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@api/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { UserRole, Profile } from '../types';

interface AuthContextType {
    user: User | null;
    role: UserRole;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>('talent');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setRole('talent');
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setProfile(data as Profile);
                setRole(data.active_role as UserRole);
            }
        } catch (error) {
            if (__DEV__) console.error(error);
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            profile,
            loading,
            signOut,
            refreshProfile: () => fetchProfile(user?.id || '')
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
