import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, JobCard, StatusBadge } from '@/components/ui';
import { useAdminJobs, useAdminSetJobStatus } from '@/features/admin/useAdmin';
import type { JobStatus } from '@/domain/contracts/types';
import { colors, spacing, typography } from '@/theme';

const labels: Record<JobStatus, string> = { draft: '작성 중', published: '게시 중', paused: '일시 중지', closed: '마감', filled: '채용 완료' };

export default function AdminJobsScreen() {
  const jobs = useAdminJobs();
  const update = useAdminSetJobStatus();
  const change = (jobId: string, title: string, status: 'published' | 'paused' | 'closed') => {
    Alert.alert('공고 상태 변경', `${title} 공고를 ‘${labels[status]}’ 상태로 바꿀까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '변경', style: status === 'closed' ? 'destructive' : 'default', onPress: () => update.mutate({ jobId, status }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>공고 관리</Text><Text style={styles.caption}>{jobs.data?.length ?? 0}건</Text></View>
      {jobs.isError ? <ErrorState onAction={() => jobs.refetch()} /> : (
        <FlatList
          data={jobs.data ?? []}
          keyExtractor={(item) => item.id}
          refreshing={jobs.isRefetching}
          onRefresh={jobs.refetch}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={<EmptyState title="등록된 공고가 없어요" />}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.statusRow}><StatusBadge label={labels[item.status]} tone={item.status === 'published' ? 'success' : item.status === 'closed' ? 'danger' : 'warning'} /></View>
              <JobCard job={item} onPress={() => undefined} />
              <View style={styles.actions}>
                {item.status === 'published' ? <Button label="일시 중지" variant="secondary" size="md" fullWidth={false} onPress={() => change(item.id, item.title, 'paused')} /> : null}
                {item.status === 'paused' ? <Button label="다시 게시" variant="secondary" size="md" fullWidth={false} onPress={() => change(item.id, item.title, 'published')} /> : null}
                {item.status === 'published' || item.status === 'paused' ? <Button label="마감" variant="danger" size="md" fullWidth={false} onPress={() => change(item.id, item.title, 'closed')} /> : null}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, header: { padding: spacing.lg, paddingBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { ...typography.title1, color: colors.textPrimary }, caption: { ...typography.body2, color: colors.textSecondary }, list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 }, item: { gap: spacing.xs }, statusRow: { flexDirection: 'row', justifyContent: 'flex-end' }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs } });
