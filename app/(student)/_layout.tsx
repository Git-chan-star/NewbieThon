import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors } from '@/theme';

export default function StudentLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user || user.role !== 'student' || !user.onboardingCompleted) {
    return <Redirect href="/" />;
  }

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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ headerTitle: '공고 상세' }} />
      <Stack.Screen name="apply/[jobId]" options={{ headerTitle: '간편 지원' }} />
      <Stack.Screen name="applications/[id]" options={{ headerTitle: '지원 상세' }} />
      <Stack.Screen name="competition/[id]" options={{ headerTitle: '대회 상세' }} />
      <Stack.Screen name="competition/[id]/create-team" options={{ headerTitle: '팀 만들기' }} />
      <Stack.Screen name="team/[id]" options={{ headerTitle: '팀 상세' }} />
    </Stack>
  );
}
