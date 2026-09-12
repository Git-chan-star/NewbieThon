import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, JobCard, StatusBadge } from '@/components/ui';
import { useEmployerJobs, useEmployerProfile } from '@/features/employer/useEmployer';
import { colors, radius, spacing, typography } from '@/theme';

export default function EmployerHomeScreen() {
  const profile = useEmployerProfile();
  const jobs = useEmployerJobs();
  const published = (jobs.data ?? []).filter((job) => job.status === 'published');
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{profile.data?.organizationName ?? '구인자'}</Text>
          <Text style={styles.title}>전공 인재와{`\n`}가볍게 일을 시작해 보세요</Text>
        </View>
        <Button label="새 공고 등록하기" onPress={() => router.push('/(employer)/create-job')} />
        <Button label="진행 중인 업무 관리" variant="secondary" onPress={() => router.push('/work')} />
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricNumber}>{published.length}</Text><Text style={styles.metricLabel}>모집 중</Text></View>
          <View style={styles.metric}><Text style={styles.metricNumber}>{jobs.data?.length ?? 0}</Text><Text style={styles.metricLabel}>전체 공고</Text></View>
          <View style={styles.metric}><StatusBadge label={profile.data?.verificationStatus === 'verified' ? '인증됨' : '미인증'} tone={profile.data?.verificationStatus === 'verified' ? 'success' : 'warning'} /></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 공고</Text>
          {jobs.isError ? <ErrorState onAction={() => jobs.refetch()} /> : published.length === 0 ? (
            <EmptyState title="아직 등록한 공고가 없어요" description="학생이 이해하기 쉬운 짧은 공고부터 등록해 보세요." />
          ) : published.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onPress={() => router.push(`/(employer)/job/${job.id}`)} />)}
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
  metrics: { flexDirection: 'row', gap: spacing.xs },
  metric: { flex: 1, minHeight: 86, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.sm, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  metricNumber: { ...typography.title1, color: colors.textPrimary },
  metricLabel: { ...typography.caption, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.title2, color: colors.textPrimary },
});
