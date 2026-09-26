import { ProtectedRoute } from '@/components/auth';
import { COLORS } from '@/constants';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function AdminLayout() {
  return (
    <ProtectedRoute requireAuth requireRole="admin">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopColor: COLORS.border,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Utilisateurs',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>👥</Text>,
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📋</Text>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>👤</Text>,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
