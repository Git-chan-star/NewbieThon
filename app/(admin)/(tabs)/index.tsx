import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorState } from '@/components/ui';
import { useAdminOverview } from '@/features/admin/useAdmin';
import { colors, radius, spacing, typography } from '@/theme';

export default function AdminHomeScreen() {
  const overview = useAdminOverview();
  const metrics = [
    ['전체 회원', overview.data?.totalUsers ?? 0],
    ['활성 학생', overview.data?.activeStudents ?? 0],
    ['활성 구인자', overview.data?.activeEmployers ?? 0],
    ['게시 공고', overview.data?.publishedJobs ?? 0],
    ['인증 대기', overview.data?.pendingVerifications ?? 0],
    ['미처리 신고', overview.data?.openReports ?? 0],
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={overview.isRefetching} onRefresh={overview.refetch} />}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>잇구 운영센터</Text>
          <Text style={styles.title}>서비스 현황을 한눈에 확인해요</Text>
          <Text style={styles.description}>회원, 공고, 인증과 신고 상태가 실제 DB 기준으로 집계됩니다.</Text>
        </View>
        {overview.isError ? <ErrorState onAction={() => overview.refetch()} /> : (
          <View style={styles.grid}>
            {metrics.map(([label, value]) => (
              <View key={label} style={styles.card}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>
            ))}
          </View>
        )}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>운영 원칙</Text>
          <Text style={styles.noticeBody}>관리자 작업은 모두 감사 기록에 남습니다. 공고 마감이나 회원 정지는 신고 내용과 사실관계를 확인한 뒤 처리해 주세요.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  heading: { gap: spacing.xs },
  eyebrow: { ...typography.body2Bold, color: colors.primary },
  title: { ...typography.hero, color: colors.textPrimary },
  description: { ...typography.body2, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '48%', minHeight: 108, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', gap: spacing.xxs },
  value: { ...typography.title1, color: colors.textPrimary },
  label: { ...typography.body2, color: colors.textSecondary },
  notice: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.primaryMuted, gap: spacing.xs },
  noticeTitle: { ...typography.body1Bold, color: colors.primary },
  noticeBody: { ...typography.body2, color: colors.textPrimary },
});
