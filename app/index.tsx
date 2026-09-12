import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!user.role) {
    return <Redirect href="/(auth)/role-select" />;
  }

  if (user.role === 'employer') {
    return <Redirect href="/(auth)/employer-pending" />;
  }

  if (user.role === 'student' && !user.onboardingCompleted) {
    return <Redirect href="/(auth)/student-onboarding/basic-info" />;
  }

  return <Redirect href="/(student)/(tabs)" />;
}
