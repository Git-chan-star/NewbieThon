import { router } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, JobCard, ProgressBar, SkeletonJobCard, StatusBadge } from '@/components/ui';
import { useMyApplications } from '@/features/student/applications/useApplications';
import { useRecommendedJobs } from '@/features/student/jobs/useJobs';
import { useMyProfile } from '@/features/student/profile/useProfile';
import { useAuthStore } from '@/features/auth/store/authStore';
import { buildMatchReasons } from '@/repositories/mock/matching';
import { applicationStatusLabel } from '@/lib/format';
import { colors, spacing, typography } from '@/theme';

export default function StudentHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const recommended = useRecommendedJobs();
  const applications = useMyApplications();
  const profile = useMyProfile();

  const jobs = useMemo(() => recommended.data?.pages.flatMap((p) => p.items) ?? [], [recommended.data]);
  const inProgress = useMemo(
    () =>
      (applications.data?.pages.flatMap((p) => p.items) ?? []).filter(
        (a) => a.status !== 'rejected' && a.status !== 'withdrawn'
      ),
    [applications.data]
  );

  const isLoading = recommended.isLoading;
  const isRefreshing = recommended.isRefetching && !recommended.isFetchingNextPage;

  const onRefresh = () => {
    recommended.refetch();
    applications.refetch();
    profile.refetch();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.greeting}>{user?.displayName ?? '학생'}님, 안녕하세요</Text>
          {jobs.length > 0 ? (
            <Text style={styles.headline}>내게 맞는 새 업무 {jobs.length}개를 찾았어요</Text>
          ) : (
            <Text style={styles.headline}>프로필을 채우면 맞춤 업무를 추천해 드려요</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>맞춤 업무 추천</Text>
          </View>

          {isLoading ? (
            <View style={styles.jobList}>
              <SkeletonJobCard />
              <SkeletonJobCard />
            </View>
          ) : recommended.isError ? (
            <ErrorState onAction={() => recommended.refetch()} />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="아직 추천할 업무가 없어요"
              description="찾기 탭에서 관심 있는 분야를 검색해 보세요."
              actionLabel="공고 찾아보기"
              onAction={() => router.push('/(student)/(tabs)/search')}
            />
          ) : (
            <View style={styles.jobList}>
              {jobs.slice(0, 5).map(({ job, match }) => (
                <JobCard
                  key={job.id}
                  job={job}
                  match={match}
                  matchReasons={buildMatchReasons(match)}
                  onPress={() => router.push(`/(student)/job/${job.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>진행 중인 지원 또는 제안</Text>
          {inProgress.length === 0 ? (
            <Text style={styles.mutedText}>아직 진행 중인 지원이 없어요.</Text>
          ) : (
            <View style={styles.progressList}>
              {inProgress.slice(0, 3).map((application) => (
                <View key={application.id} style={styles.progressRow}>
                  <Text style={styles.progressTitle} numberOfLines={1}>
                    {application.job.title}
                  </Text>
                  <StatusBadge label={applicationStatusLabel[application.status]} tone="info" />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연결된 업무</Text>
          <Button label="업무 진행·결과물 관리" variant="secondary" onPress={() => router.push('/work')} />
        </View>

        {profile.data ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>프로필 완성도</Text>
            <ProgressBar progress={profile.data.profileCompletion / 100} />
            <Text style={styles.mutedText}>
              {profile.data.profileCompletion}% 완성됐어요.
              {profile.data.profileCompletion < 100 ? ' 프로젝트를 추가하면 더 좋은 추천을 받을 수 있어요.' : ''}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  headerBlock: { gap: spacing.xxs },
  greeting: { ...typography.body2, color: colors.textSecondary },
  headline: { ...typography.title1, color: colors.textPrimary },
  section: { gap: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.title2, color: colors.textPrimary },
  jobList: { gap: spacing.sm },
  mutedText: { ...typography.body2, color: colors.textTertiary },
  progressList: { gap: spacing.xs },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    borderRadius: 12,
    padding: spacing.md,
  },
  progressTitle: { ...typography.body2Bold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
});
