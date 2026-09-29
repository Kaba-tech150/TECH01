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
        {/*
         * `href: null` RETIRE LA ROUTE DE LA BARRE D'ONGLETS.
         *
         * Même règle que dans l'espace client, et même conséquence si elle
         * manque : l'exécution d'une mission est un écran d'action, atteint
         * depuis l'accueil ou la liste, jamais une destination d'onglet. Sans
         * cette ligne, l'agent verrait un onglet « Mission en cours » qui vide
         * l'écran, faute de paramètre `id`.
         */}
        <Tabs.Screen
          name="mission/[id]"
          options={{ href: null, title: 'Mission en cours' }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
