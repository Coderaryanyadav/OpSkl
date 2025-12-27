import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { supabase } from '../core/api/supabase';
import { AuraColors, AuraShadows } from '../core/theme/aura';
import { PlusSquare, User, Briefcase, MessageSquare, Zap, LayoutDashboard } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AuraLoader } from '../core/components/AuraLoader';
import { BlurView } from 'expo-blur';

// Screens - Auth
import LoginScreen from '../features/auth/screens/LoginScreen';
import SignUpScreen from '../features/auth/screens/SignUpScreen';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';

// Screens - Worker / Talent
import WorkerFeedScreen from '../features/worker/screens/WorkerFeedScreen';
import WorkerMyGigsScreen from '../features/worker/screens/WorkerMyGigsScreen';
import DailyQuestsScreen from '../features/worker/screens/DailyQuestsScreen';
import LeaderboardScreen from '../features/worker/screens/LeaderboardScreen';
import TalentPerksScreen from '../features/worker/screens/TalentPerksScreen';
import ReviewScreen from '../features/worker/screens/ReviewScreen';

// Screens - Client
import CreateGigScreen from '../features/client/screens/CreateGigScreen';
import ClientManageGigsScreen from '../features/client/screens/ClientManageGigsScreen';
import GigManagerScreen from '../features/client/screens/GigManagerScreen';
import ClientProfileScreen from '../features/client/screens/ClientProfileScreen';

// Screens - Chat
import ChatScreen from '../features/chat/screens/ChatScreen';
import MessageListScreen from '../features/chat/screens/MessageListScreen';

// Screens - Profile & Settings
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import WalletScreen from '../features/profile/screens/WalletScreen';
import SettingsScreen from '../features/profile/screens/SettingsScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import PublicProfileScreen from '../features/profile/screens/PublicProfileScreen';
import VerificationScreen from '../features/profile/screens/VerificationScreen';
import TrustedContactsScreen from '../features/profile/screens/TrustedContactsScreen';
import NotificationsScreen from '../features/profile/screens/NotificationsScreen';

// Screens - Legal
import PrivacyPolicyScreen from '../features/legal/screens/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation, role }: any) {
    return (
        <View style={styles.tabBarWrapper}>
            <BlurView intensity={30} tint="dark" style={styles.tabBarBlur}>
                <View style={styles.tabBarContent}>
                    {state.routes.map((route: any, index: number) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                Haptics.selectionAsync();
                                navigation.navigate(route.name);
                            }
                        };

                        const Icon = options.tabBarIcon;
                        const activeColor = AuraColors.primary;
                        const inactiveColor = AuraColors.gray500;

                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={onPress}
                                style={styles.tabItem}
                            >
                                <View style={styles.iconContainer}>
                                    {Icon && <Icon color={isFocused ? activeColor : inactiveColor} size={24} />}
                                    {isFocused && (
                                        <View style={styles.activeIndicator} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

function WorkerTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} role="worker" />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Discovery"
                component={WorkerFeedScreen}
                options={{ tabBarIcon: ({ color, size }) => <Zap color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Operations"
                component={WorkerMyGigsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Comms"
                component={MessageListScreen}
                options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
}

function ClientTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} role="client" />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Create"
                component={CreateGigScreen}
                options={{ tabBarIcon: ({ color, size }) => <PlusSquare color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Manage"
                component={ClientManageGigsScreen}
                options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Comms"
                component={MessageListScreen}
                options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ClientProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
    );
}

function AppStack({ userRole }: { userRole: 'talent' | 'client' }) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
                {() => userRole === 'talent' ? <WorkerTabs /> : <ClientTabs />}
            </Stack.Screen>
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="GigManager" component={GigManagerScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="TrustedContacts" component={TrustedContactsScreen} />
            <Stack.Screen name="TalentPerks" component={TalentPerksScreen} />
            <Stack.Screen name="DailyQuests" component={DailyQuestsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
}

export default function RootNavigator() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'talent' | 'client'>('talent');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            if (currentSession) fetchUserRole(currentSession.user.id);
            else setLoading(false);
        });

        supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession) fetchUserRole(newSession.user.id);
            else setLoading(false);
        });
    }, []);

    async function fetchUserRole(userId: string) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('active_role')
                .eq('id', userId)
                .single();

            if (data) {
                setUserRole(data.active_role as 'talent' | 'client');
            }
        } catch (error) {
            console.log('[RootNavigator] Role fetch error:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loading}>
                <AuraLoader size={48} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {session ? <AppStack userRole={userRole} /> : <AuthStack />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AuraColors.background,
    },
    tabBarWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 20,
        left: 20,
        right: 20,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.floating,
    },
    tabBarBlur: {
        height: 64,
    },
    tabBarContent: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: 40,
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: AuraColors.primary,
        position: 'absolute',
        bottom: -6,
        ...AuraShadows.soft,
        shadowColor: AuraColors.primary,
    }
});
