import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../hooks/useTheme'; // Custom theme utility we will build, or standard color mappings

// Screens imports (we will build these screens next)
import AuthScreen from '../../features/auth/screens/AuthScreen';
import ChatScreen from '../../features/chat/screens/ChatScreen';
import GigDiscoveryScreen from '../../features/gig-discovery/screens/GigDiscoveryScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import WalletScreen from '../../features/profile/screens/WalletScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigation
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}

// Client Tab Navigation
function ClientTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Gigs" component={GigDiscoveryScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Worker Tab Navigation
function WorkerTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Jobs" component={GigDiscoveryScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, loading, userRole, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F19' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          userRole === 'worker' ? (
            <Stack.Screen name="WorkerHome" component={WorkerTabNavigator} />
          ) : (
            <Stack.Screen name="ClientHome" component={ClientTabNavigator} />
          )
        ) : (
          <Stack.Screen name="AuthHome" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
