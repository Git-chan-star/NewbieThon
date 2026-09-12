import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ChoiceChip, EmptyState, ErrorState, StatusBadge, VerificationBadge } from '@/components/ui';
import type { ApplicationStatus } from '@/domain/contracts/types';
import { useMyApplications, useRespondToOffer, useMyOffers } from '@/features/student/applications/useApplications';
import { applicationStatusLabel, formatCompensation, formatDeadlineRemaining } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

type Segment = 'applications' | 'offers';
type StatusFilter = 'all' | 'reviewing' | 'talking' | 'result';

const STATUS_GROUPS: Record<StatusFilter, ApplicationStatus[] | null> = {
  all: null,
  reviewing: ['submitted', 'viewed'],
  talking: ['chatting', 'interview'],
  result: ['accepted', 'rejected', 'withdrawn'],
};

const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  submitted: 'info',
  viewed: 'info',
  chatting: 'warning',
  interview: 'warning',
  accepted: 'success',
  rejected: 'neutral',
  withdrawn: 'neutral',
};

export default function ApplicationsScreen() {
  const [segment, setSegment] = useState<Segment>('applications');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const applications = useMyApplications();
  const offers = useMyOffers();
  const respondToOffer = useRespondToOffer();

  const applicationItems = useMemo(() => applications.data?.pages.flatMap((p) => p.items) ?? [], [applications.data]);
  const offerItems = useMemo(() => offers.data?.pages.flatMap((p) => p.items) ?? [], [offers.data]);

  const filtered = applicationItems.filter((a) => {
    const group = STATUS_GROUPS[statusFilter];
    return !group || group.includes(a.status);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>지원 현황</Text>
        <View style={styles.segmentRow}>
          <ChoiceChip label="지원 현황" selected={segment === 'applications'} onPress={() => setSegment('applications')} />
          <ChoiceChip label={`받은 제안 ${offerItems.length > 0 ? offerItems.length : ''}`.trim()} selected={segment === 'offers'} onPress={() => setSegment('offers')} />
        </View>
      </View>

      {segment === 'applications' ? (
        <>
          <View style={styles.filterRow}>
            <ChoiceChip label="전체" selected={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
            <ChoiceChip label="검토 중" selected={statusFilter === 'reviewing'} onPress={() => setStatusFilter('reviewing')} />
            <ChoiceChip label="대화·면접" selected={statusFilter === 'talking'} onPress={() => setStatusFilter('talking')} />
            <ChoiceChip label="결과 확인" selected={statusFilter === 'result'} onPress={() => setStatusFilter('result')} />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => router.push(`/(student)/applications/${item.id}`)}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.job.title}
                </Text>
                <Text style={styles.cardSubtitle}>{item.job.employerName}</Text>
                <View style={styles.cardFooter}>
                  <StatusBadge label={applicationStatusLabel[item.status]} tone={STATUS_TONE[item.status]} />
                  <Text style={styles.cardCompensation}>{formatCompensation(item.job)}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              applications.isLoading ? null : applications.isError ? (
                <ErrorState onAction={() => applications.refetch()} />
              ) : (
                <EmptyState
                  title="아직 지원한 공고가 없어요"
                  description="찾기 탭에서 관심 있는 업무를 찾아보세요."
                  actionLabel="공고 찾아보기"
                  onAction={() => router.push('/(student)/(tabs)/search')}
                />
              )
            }
          />
        </>
      ) : (
        <FlatList
          data={offerItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.jobTitle}</Text>
              <View style={styles.employerRow}>
                <Text style={styles.cardSubtitle}>{item.employerName}</Text>
                <VerificationBadge verified={item.employerVerified} />
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              {item.expiresAt ? (
                <Text style={styles.cardDeadline}>{formatDeadlineRemaining(item.expiresAt)}</Text>
              ) : null}

              {item.status === 'sent' || item.status === 'viewed' ? (
                <View style={styles.offerActions}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="거절"
                      onPress={() => respondToOffer.mutate({ offerId: item.id, decision: 'decline' })}
                      variant="ghost"
                      size="md"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="수락"
                      onPress={() => respondToOffer.mutate({ offerId: item.id, decision: 'accept' })}
                      size="md"
                    />
                  </View>
                </View>
              ) : (
                <StatusBadge
                  label={item.status === 'accepted' ? '수락했어요' : item.status === 'declined' ? '거절했어요' : '만료됨'}
                  tone={item.status === 'accepted' ? 'success' : 'neutral'}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            offers.isLoading ? null : offers.isError ? (
              <ErrorState onAction={() => offers.refetch()} />
            ) : (
              <EmptyState title="아직 받은 제안이 없어요" description="프로필을 채우면 구인자의 제안을 받을 수 있어요." />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm },
  headerTitle: { ...typography.title1, color: colors.textPrimary },
  segmentRow: { flexDirection: 'row', gap: spacing.xs },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  listContent: { padding: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  cardTitle: { ...typography.body1Bold, color: colors.textPrimary },
  cardSubtitle: { ...typography.body2, color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  cardCompensation: { ...typography.body2Bold, color: colors.textPrimary },
  employerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardMessage: { ...typography.body2, color: colors.textSecondary, marginTop: spacing.xxs },
  cardDeadline: { ...typography.caption, color: colors.warning },
  offerActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
