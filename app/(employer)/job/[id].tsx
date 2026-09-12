import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, StatusBadge } from '@/components/ui';
import type { ApplicationStatus } from '@/domain/contracts/types';
import { useApplicants, useChangeApplicantStatus, useChangeJobStatus } from '@/features/employer/useEmployer';
import { applicationStatusLabel } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const applicants = useApplicants(id);
  const change = useChangeApplicantStatus(id);
  const jobStatus = useChangeJobStatus();
  const update = (applicationId: string, status: Extract<ApplicationStatus, 'viewed' | 'chatting' | 'accepted' | 'rejected'>) => change.mutate({ applicationId, status });
  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.top}><Text style={styles.title}>지원자 {applicants.data?.length ?? 0}명</Text><Button label="모집 마감" variant="secondary" size="md" fullWidth={false} onPress={() => jobStatus.mutate({ jobId: id, status: 'closed' })} /></View>
    {!applicants.data?.length ? <EmptyState title="아직 지원자가 없어요" description="지원이 도착하면 프로필과 답변을 여기서 확인할 수 있어요." /> : applicants.data.map((applicant) => <View key={applicant.id} style={styles.card}>
      <View style={styles.cardHeader}><View><Text style={styles.name}>{applicant.displayName}</Text><Text style={styles.meta}>{[applicant.schoolName, applicant.majorName].filter(Boolean).join(' · ')}</Text></View><StatusBadge label={applicationStatusLabel[applicant.status]} tone="info" /></View>
      {applicant.shortAnswer ? <Text style={styles.answer}>{applicant.shortAnswer}</Text> : null}
      <View style={styles.actions}>
        {applicant.status === 'submitted' ? <Button label="프로필 확인 완료" size="md" onPress={() => update(applicant.id, 'viewed')} /> : null}
        {applicant.status === 'viewed' ? <Button label="대화 시작" size="md" onPress={() => update(applicant.id, 'chatting')} /> : null}
        {['chatting', 'interview'].includes(applicant.status) ? <View style={styles.half}><Button label="함께하기" size="md" variant="secondary" onPress={() => update(applicant.id, 'accepted')} /></View> : null}
        {['viewed', 'chatting', 'interview'].includes(applicant.status) ? <View style={styles.half}><Button label="이번에는 거절" size="md" variant="ghost" onPress={() => update(applicant.id, 'rejected')} /></View> : null}
      </View>
    </View>)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.lg }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { ...typography.title1, color: colors.textPrimary }, card: { padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, gap: spacing.sm }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, name: { ...typography.body1Bold, color: colors.textPrimary }, meta: { ...typography.caption, color: colors.textSecondary }, answer: { ...typography.body2, color: colors.textPrimary }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, half: { flex: 1, minWidth: 100 } });
