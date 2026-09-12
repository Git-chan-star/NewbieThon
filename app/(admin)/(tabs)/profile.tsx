import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StatusBadge } from '@/components/ui';
import { useSignOut } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function AdminProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useSignOut();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>관리자 계정</Text>
        <View style={styles.card}><View style={styles.icon}><Text style={styles.iconText}>잇</Text></View><Text style={styles.name}>{user?.displayName ?? '잇구 관리자'}</Text><StatusBadge label="마스터 관리자" tone="success" /><Text style={styles.description}>이 계정의 변경 작업은 감사 기록에 저장됩니다.</Text></View>
        <Button label="로그아웃" variant="secondary" onPress={() => signOut.mutate()} loading={signOut.isPending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.lg }, title: { ...typography.title1, color: colors.textPrimary }, card: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, icon: { width: 58, height: 58, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryMuted }, iconText: { ...typography.title1, color: colors.primary }, name: { ...typography.title2, color: colors.textPrimary }, description: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' } });
