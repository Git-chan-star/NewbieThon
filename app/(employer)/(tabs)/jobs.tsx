import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, JobCard } from '@/components/ui';
import { useEmployerJobs } from '@/features/employer/useEmployer';
import { colors, spacing, typography } from '@/theme';

export default function EmployerJobsScreen() {
  const jobs = useEmployerJobs();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>내 공고</Text><Button label="공고 등록" fullWidth={false} size="md" onPress={() => router.push('/(employer)/create-job')} /></View>
      <FlatList data={jobs.data ?? []} keyExtractor={(item) => item.id} refreshing={jobs.isRefetching} onRefresh={jobs.refetch} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />} renderItem={({ item }) => <JobCard job={item} onPress={() => router.push(`/(employer)/job/${item.id}`)} />} ListEmptyComponent={<EmptyState title="등록한 공고가 없어요" description="첫 전공 업무를 등록해 보세요." />} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, header: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { ...typography.title1, color: colors.textPrimary }, list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 } });
