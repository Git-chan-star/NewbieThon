import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors } from '@/theme';

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== 'admin' || !user.onboardingCompleted) return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
