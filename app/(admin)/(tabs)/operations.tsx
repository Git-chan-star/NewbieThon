import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, StatusBadge } from '@/components/ui';
import { useAdminReports, useAdminSetReportStatus, useAdminVerifications, useReviewVerification } from '@/features/admin/useAdmin';
import { colors, radius, spacing, typography } from '@/theme';

export default function AdminOperationsScreen() {
  const verifications = useAdminVerifications();
  const reports = useAdminReports();
  const review = useReviewVerification();
  const updateReport = useAdminSetReportStatus();
  const refreshing = verifications.isRefetching || reports.isRefetching;
  const refresh = () => { void verifications.refetch(); void reports.refetch(); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Text style={styles.title}>인증·신고 운영</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구인자 인증 대기</Text>
          {verifications.isError ? <ErrorState onAction={() => verifications.refetch()} /> : (verifications.data ?? []).filter((item) => item.status === 'pending').length === 0 ? <EmptyState title="대기 중인 인증이 없어요" /> : (verifications.data ?? []).filter((item) => item.status === 'pending').map((item) => (
            <View key={item.userId} style={styles.card}>
              <View style={styles.row}><View style={styles.info}><Text style={styles.name}>{item.organizationName}</Text><Text style={styles.meta}>{item.contactName} · {item.workEmail}</Text></View><StatusBadge label="검토 대기" tone="warning" /></View>
              {item.documentPath ? <Text style={styles.path}>제출 문서: {item.documentPath}</Text> : <Text style={styles.path}>제출 문서 없음</Text>}
              <View style={styles.actions}><Button label="승인" size="md" fullWidth={false} onPress={() => Alert.alert('구인자 인증 승인', `${item.organizationName}을 인증할까요?`, [{ text: '취소', style: 'cancel' }, { text: '승인', onPress: () => review.mutate({ userId: item.userId, decision: 'verified' }) }])} /><Button label="반려" variant="danger" size="md" fullWidth={false} onPress={() => Alert.alert('구인자 인증 반려', `${item.organizationName}의 인증을 반려할까요?`, [{ text: '취소', style: 'cancel' }, { text: '반려', style: 'destructive', onPress: () => review.mutate({ userId: item.userId, decision: 'rejected', note: '제출 정보를 다시 확인해 주세요.' }) }])} /></View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>신고 접수</Text>
          {reports.isError ? <ErrorState onAction={() => reports.refetch()} /> : (reports.data ?? []).filter((item) => item.status === 'received' || item.status === 'reviewing').length === 0 ? <EmptyState title="처리할 신고가 없어요" /> : (reports.data ?? []).filter((item) => item.status === 'received' || item.status === 'reviewing').map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}><View style={styles.info}><Text style={styles.name}>{item.reasonCode}</Text><Text style={styles.meta}>{item.targetType} · {new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text></View><StatusBadge label={item.status === 'received' ? '접수' : '검토 중'} tone="warning" /></View>
              {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
              <View style={styles.actions}>{item.status === 'received' ? <Button label="검토 시작" variant="secondary" size="md" fullWidth={false} onPress={() => updateReport.mutate({ reportId: item.id, status: 'reviewing' })} /> : null}<Button label="처리 완료" size="md" fullWidth={false} onPress={() => updateReport.mutate({ reportId: item.id, status: 'resolved' })} /><Button label="기각" variant="danger" size="md" fullWidth={false} onPress={() => updateReport.mutate({ reportId: item.id, status: 'dismissed' })} /></View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl }, title: { ...typography.title1, color: colors.textPrimary }, section: { gap: spacing.sm }, sectionTitle: { ...typography.title2, color: colors.textPrimary }, card: { padding: spacing.lg, gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }, info: { flex: 1, gap: spacing.xxs }, name: { ...typography.body1Bold, color: colors.textPrimary }, meta: { ...typography.body2, color: colors.textSecondary }, path: { ...typography.caption, color: colors.textSecondary }, detail: { ...typography.body2, color: colors.textPrimary }, actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs } });
