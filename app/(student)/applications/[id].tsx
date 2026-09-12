import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, StatusBadge, StickyBottomAction } from '@/components/ui';
import { useApplicationDetail, useWithdrawApplication } from '@/features/student/applications/useApplications';
import { applicationStatusLabel, formatCompensation, formatKoreanDate } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: application, isLoading, isError, refetch } = useApplicationDetail(id);
  const withdraw = useWithdrawApplication();

  if (isLoading || !application) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>불러오는 중이에요...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <ErrorState onAction={() => refetch()} />
      </View>
    );
  }

  const canWithdraw = !['accepted', 'rejected', 'withdrawn'].includes(application.status);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBadge label={applicationStatusLabel[application.status]} tone="info" />
        <Text style={styles.title}>{application.job.title}</Text>
        <Text style={styles.subtitle}>{application.job.employerName}</Text>
        <Text style={styles.compensation}>{formatCompensation(application.job)}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>지원일</Text>
          <Text style={styles.cardValue}>{formatKoreanDate(application.submittedAt)}</Text>

          {application.availableStartDate ? (
            <>
              <Text style={styles.cardLabel}>시작 가능일</Text>
              <Text style={styles.cardValue}>{application.availableStartDate}</Text>
            </>
          ) : null}

          {application.availabilityNote ? (
            <>
              <Text style={styles.cardLabel}>일정 메모</Text>
              <Text style={styles.cardValue}>{application.availabilityNote}</Text>
            </>
          ) : null}

          {application.shortAnswer ? (
            <>
              <Text style={styles.cardLabel}>남긴 메시지</Text>
              <Text style={styles.cardValue}>{application.shortAnswer}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      {canWithdraw ? (
        <StickyBottomAction>
          <Button
            label="지원 취소하기"
            onPress={() =>
              withdraw.mutate(application.id, {
                onSuccess: () => router.back(),
              })
            }
            variant="danger"
            loading={withdraw.isPending}
          />
        </StickyBottomAction>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  mutedText: { ...typography.body2, color: colors.textTertiary },
  container: { padding: spacing.xl, gap: spacing.xs },
  title: { ...typography.title1, color: colors.textPrimary, marginTop: spacing.sm },
  subtitle: { ...typography.body1, color: colors.textSecondary },
  compensation: { ...typography.body1Bold, color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardLabel: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm },
  cardValue: { ...typography.body1Bold, color: colors.textPrimary },
});
