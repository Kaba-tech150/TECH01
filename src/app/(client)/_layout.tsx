import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProtectedRoute } from '@/components/auth';
import { COLORS, FONT_SIZES, SHADOWS } from '@/constants';
import { Tabs } from 'expo-router';

/**
 * Icônes de la barre d'onglets.
 *
 * `color` est fourni par React Navigation : la teinte active suit
 * `tabBarActiveTintColor`. On retient `primary` (teal) et non `cyan` — un
 * libellé de 10px en `#00D2FF` sur fond clair est illisible.
 */
const ICONES = {
  accueil: 'home-outline',
  missions: 'clipboard-text-outline',
  search: 'magnify',
  profile: 'account-outline',
} as const;

export default function ClientLayout() {
  return (
    <ProtectedRoute requireAuth requireRole="client">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarLabelStyle: {
            fontSize: FONT_SIZES.xs,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopColor: 'rgba(0, 210, 255, 0.18)',
            ...SHADOWS.header,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={ICONES.accueil} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={ICONES.missions} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Rechercher',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={ICONES.search} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={ICONES.profile} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
