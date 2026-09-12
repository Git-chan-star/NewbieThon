import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors } from '@/theme';

export default function EmployerLayout() {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== 'employer' || !user.onboardingCompleted) return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerTitle: '', headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg }, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-job" options={{ headerTitle: '공고 등록' }} />
      <Stack.Screen name="job/[id]" options={{ headerTitle: '지원자 관리' }} />
    </Stack>
  );
}
