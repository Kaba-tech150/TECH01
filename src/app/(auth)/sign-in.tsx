import { Header } from '@/components/common';
import { SignInForm } from '@/components/forms';
import { COLORS, SPACING } from '@/constants';
import { isPublicProfile } from '@/lib/storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const { profile } = useLocalSearchParams<{ profile?: string }>();
  const selectedProfile = isPublicProfile(profile) ? profile : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Header showLogin={false} />
        <View style={styles.formContainer}>
          <SignInForm
            onSuccess={() => router.replace('/(auth)/role-selection')}
            onSignUpPress={() => router.push(selectedProfile ? { pathname: '/(auth)/sign-up', params: { profile: selectedProfile } } : '/(auth)/sign-up')}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  formContainer: {
    marginTop: SPACING.xl,
  },
});
