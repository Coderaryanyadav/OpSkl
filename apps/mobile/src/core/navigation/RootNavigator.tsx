import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AuraColors, AuraShadows } from '@theme/aura';
import { PlusSquare, User, Briefcase, MessageSquare, Zap, LayoutDashboard } from 'lucide-react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraLoader } from '@core/components/AuraLoader';
import { BlurView } from 'expo-blur';
import { useAuth } from '@context/AuthProvider';
import { useAura } from '@core/context/AuraProvider';

// Screens - Auth
import LoginScreen from '@features/auth/screens/LoginScreen';
import SignUpScreen from '@features/auth/screens/SignUpScreen';
import OnboardingScreen from '@features/auth/screens/OnboardingScreen';

// Screens - Worker / Talent
import WorkerFeedScreen from '@features/worker/screens/WorkerFeedScreen';
import WorkerMyGigsScreen from '@features/worker/screens/WorkerMyGigsScreen';
import GigDetailsScreen from '@features/gig-discovery/screens/GigDetailsScreen';
import ReviewScreen from '@features/worker/screens/ReviewScreen';
import DisputeScreen from '@features/gig-discovery/screens/DisputeScreen';
import TalentPerksScreen from '@features/worker/screens/TalentPerksScreen';

// Screens - Client
import CreateGigScreen from '@features/client/screens/CreateGigScreen';
import ClientManageGigsScreen from '@features/client/screens/ClientManageGigsScreen';
import GigManagerScreen from '@features/client/screens/GigManagerScreen';
import ClientProfileScreen from '@features/client/screens/ClientProfileScreen';

// Screens - Chat
import ChatScreen from '@features/chat/screens/ChatScreen';
import MessageListScreen from '@features/chat/screens/MessageListScreen';

// Screens - Profile & Settings
import ProfileScreen from '@features/profile/screens/ProfileScreen';
import WalletScreen from '@features/profile/screens/WalletScreen';
import SettingsScreen from '@features/profile/screens/SettingsScreen';
import EditProfileScreen from '@features/profile/screens/EditProfileScreen';
import PortfolioUploadScreen from '@features/profile/screens/PortfolioUploadScreen';
import PublicProfileScreen from '@features/profile/screens/PublicProfileScreen';
import VerificationScreen from '@features/profile/screens/VerificationScreen';
import TrustedContactsScreen from '@features/profile/screens/TrustedContactsScreen';
import NotificationsScreen from '@features/profile/screens/NotificationsScreen';
import NotificationPreferencesScreen from '@features/profile/screens/NotificationPreferencesScreen';

// Screens - Legal
import PrivacyPolicyScreen from '@features/legal/screens/PrivacyPolicyScreen';
import { AuraText } from '@core/components/AuraText';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- CUSTOM TAB BAR COMPONENT ---
function AuraTabBar({ state, descriptors, navigation }: any) {
    const haptics = useAuraHaptics();

    return (
        <View style={styles.tabBarContainer}>
            <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.tabContent}>
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
                            navigation.navigate(route.name);
                        }
                    };

                    const Icon = options.tabBarIcon;

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <Icon color={isFocused ? AuraColors.primary : AuraColors.gray600} size={24} />
                            {isFocused && <View style={styles.indicator} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

// --- TAB NAVIGATORS ---

function TalentTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <AuraTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Feed"
                component={WorkerFeedScreen}
                options={{ tabBarIcon: (props: any) => <Zap {...props} /> }}
            />
            <Tab.Screen
                name="MyGigs"
                component={WorkerMyGigsScreen}
                options={{ tabBarIcon: (props: any) => <Briefcase {...props} /> }}
            />
            <Tab.Screen
                name="Messages"
                component={MessageListScreen}
                options={{ tabBarIcon: (props: any) => <MessageSquare {...props} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: (props: any) => <User {...props} /> }}
            />
        </Tab.Navigator>
    );
}

function ClientTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <AuraTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Manage"
                component={ClientManageGigsScreen}
                options={{ tabBarIcon: (props: any) => <LayoutDashboard {...props} /> }}
            />
            <Tab.Screen
                name="Create"
                component={CreateGigScreen}
                options={{ tabBarIcon: (props: any) => <PlusSquare {...props} /> }}
            />
            <Tab.Screen
                name="Messages"
                component={MessageListScreen}
                options={{ tabBarIcon: (props: any) => <MessageSquare {...props} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: (props: any) => <User {...props} /> }}
            />
        </Tab.Navigator>
    );
}

// --- ROOT NAVIGATOR ---

export default function RootNavigator() {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center' }}>
                <AuraLoader size={40} />
            </View>
        );
    }

    const linking = {
        prefixes: ['opskl://', 'https://opskl.com'],
        config: {
            screens: {
                Main: {
                    screens: {
                        Feed: 'feed',
                        Manage: 'manage',
                        Messages: 'messages',
                    },
                },
                Chat: 'chat/:roomId',
                GigManager: 'gig/:gigId',
                Notifications: 'notifications',
                Review: 'review/:gigId',
            }
        }
    };

    return (
        <NavigationContainer linking={linking as any}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                {!user ? (
                    // AUTH STACK
                    <Stack.Group>
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                    </Stack.Group>
                ) : (
                    // APP STACK
                    <Stack.Group>
                        {profile?.active_role === 'client' ? (
                            <Stack.Screen name="Main" component={ClientTabs} />
                        ) : (
                            <Stack.Screen name="Main" component={TalentTabs} />
                        )}

                        {/* Common Screens */}
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="Wallet" component={WalletScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
                        <Stack.Screen name="Verification" component={VerificationScreen} />
                        <Stack.Screen name="TrustedContacts" component={TrustedContactsScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

                        <Stack.Screen name="PortfolioUpload" component={PortfolioUploadScreen} />

                        {/* Client specific modal-like screens */}
                        <Stack.Screen name="GigManager" component={GigManagerScreen} />

                        {/* Talent specific modal-like screens */}
                        <Stack.Screen name="Review" component={ReviewScreen} />
                        <Stack.Screen name="Dispute" component={DisputeScreen} />
                        <Stack.Screen name="TalentPerks" component={TalentPerksScreen} />

                        {/* Common Gig Screens */}
                        <Stack.Screen name="GigDetails" component={GigDetailsScreen} />
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 90 : 70,
        backgroundColor: 'transparent',
    },
    tabContent: {
        flexDirection: 'row',
        height: 70,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicator: {
        position: 'absolute',
        bottom: 8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: AuraColors.primary,
    }
});
