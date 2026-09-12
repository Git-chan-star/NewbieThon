import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSessionBootstrap } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { queryClient } from '@/lib/queryClient';
import { isProductionBackendMissing } from '@/lib/supabase';
import { colors } from '@/theme';

function AppGate() {
  useSessionBootstrap();
  const status = useAuthStore((s) => s.status);

  if (isProductionBackendMissing) {
    return (
      <View style={{ flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>
          서버 연결 설정이 필요해요
        </Text>
        <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' }}>
          운영용 Supabase 환경값을 등록한 뒤 다시 빌드해 주세요.
        </Text>
      </View>
    );
  }

  if (status === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="로딩 중" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AppGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
