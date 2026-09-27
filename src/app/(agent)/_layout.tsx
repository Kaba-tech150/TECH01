import { ProtectedRoute } from '@/components/auth';
import { TAB_BAR_SCREEN_OPTIONS, TAB_ICONS } from '@/components/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AgentLayout() {
  return (
    <ProtectedRoute requireAuth requireRole="agent">
      <Tabs screenOptions={TAB_BAR_SCREEN_OPTIONS}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.accueil} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.missions} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="availability"
          options={{
            title: 'Disponibilités',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name={TAB_ICONS.disponibilites}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.profil} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
