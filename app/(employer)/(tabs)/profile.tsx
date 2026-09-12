import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StatusBadge } from '@/components/ui';
import { useSignOut } from '@/features/auth/hooks/useAuth';
import { useEmployerProfile } from '@/features/employer/useEmployer';
import { colors, radius, spacing, typography } from '@/theme';

export default function EmployerProfileScreen() {
  const profile = useEmployerProfile();
  const signOut = useSignOut();
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.container}><Text style={styles.title}>내 정보</Text><View style={styles.card}><Text style={styles.name}>{profile.data?.organizationName ?? '조직 정보'}</Text><Text style={styles.meta}>{profile.data?.organizationType}</Text><StatusBadge label={profile.data?.verificationStatus === 'verified' ? '인증 구인자' : '인증 전'} tone={profile.data?.verificationStatus === 'verified' ? 'success' : 'warning'} /><Text style={styles.body}>{profile.data?.introduction}</Text></View><Button label="로그아웃" variant="secondary" onPress={() => signOut.mutate()} loading={signOut.isPending} /></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.lg }, title: { ...typography.title1, color: colors.textPrimary }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs }, name: { ...typography.title2, color: colors.textPrimary }, meta: { ...typography.body2, color: colors.textSecondary }, body: { ...typography.body2, color: colors.textPrimary } });
