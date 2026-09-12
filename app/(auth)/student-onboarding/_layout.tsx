import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function StudentOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="complete" options={{ headerBackVisible: false, gestureEnabled: false }} />
    </Stack>
  );
}
