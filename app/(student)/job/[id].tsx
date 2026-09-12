import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, StatusBadge, StickyBottomAction, VerificationBadge } from '@/components/ui';
import { useJobDetail, useToggleSaveJob } from '@/features/student/jobs/useJobs';
import { buildMatchReasons } from '@/repositories/mock/matching';
import {
  formatCompensation,
  formatDeadlineRemaining,
  formatDifficulty,
  formatHours,
  formatKoreanDate,
  formatWorkMode,
  isDeadlinePassed,
} from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading, isError, refetch } = useJobDetail(id);
  const toggleSave = useToggleSaveJob();

  if (isLoading || !job) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>불러오는 중이에요...</Text>
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

  const reasons = job.match ? buildMatchReasons(job.match) : [];
  const deadlinePassed = isDeadlinePassed(job.applicationDeadline);
  const isClosed = job.status === 'closed' || job.status === 'paused' || job.status === 'filled';

  const applyDisabledReason = job.isOwnJob
    ? '본인이 등록한 공고에는 지원할 수 없어요.'
    : isClosed
      ? '마감되었거나 중단된 공고예요.'
      : deadlinePassed
        ? '지원 마감일이 지났어요.'
        : undefined;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.summary}>{job.summary}</Text>
        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.metaCard}>
          <Text style={styles.metaLine}>{formatCompensation(job)}</Text>
          {formatHours(job) ? <Text style={styles.metaLine}>{formatHours(job)}</Text> : null}
          <Text style={styles.metaLine}>{formatWorkMode(job.workMode)} · {formatDifficulty(job.difficulty)}</Text>
          {job.locationText ? <Text style={styles.metaLine}>{job.locationText}</Text> : null}
        </View>

        {reasons.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내가 이 공고와 맞는 이유</Text>
            {reasons.map((reason) => (
              <Text key={reason} style={styles.reasonText}>
                · {reason}
              </Text>
            ))}
            {job.match && job.match.missingRequiredSkillNames.length > 0 ? (
              <Text style={styles.missingText}>
                지원 전에 확인해 주세요: {job.match.missingRequiredSkillNames.join(', ')}이(가) 아직 부족해요.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>해야 할 일</Text>
          {job.responsibilities.map((item) => (
            <Text key={item} style={styles.listText}>
              · {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>만들어야 할 결과물</Text>
          {job.deliverables.map((item) => (
            <Text key={item} style={styles.listText}>
              · {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>필요한 기술과 수준</Text>
          <View style={styles.badgeRow}>
            {job.requiredSkills.map((skill) => (
              <StatusBadge
                key={skill.skillId}
                label={`${skill.skillName}${skill.required ? '' : ' (우대)'}`}
                tone={skill.required ? 'warning' : 'neutral'}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>교육·피드백 제공 여부</Text>
          <Text style={styles.listText}>{job.educationOrFeedback ? '업무 중 피드백을 제공해요.' : '별도 교육·피드백은 제공하지 않아요.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구인자 정보</Text>
          <View style={styles.employerRow}>
            <Text style={styles.listText}>{job.employerName}</Text>
            <VerificationBadge verified={job.employerVerified} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지원 마감일</Text>
          <Text style={styles.listText}>
            {formatKoreanDate(job.applicationDeadline) ?? '상시 모집'}
            {job.applicationDeadline ? ` · ${formatDeadlineRemaining(job.applicationDeadline)}` : ''}
          </Text>
        </View>
      </ScrollView>

      <StickyBottomAction>
        {applyDisabledReason ? (
          <View style={styles.disabledBlock}>
            <Text style={styles.disabledText}>{applyDisabledReason}</Text>
            <Button label="지원할 수 없어요" onPress={() => {}} disabled />
          </View>
        ) : job.alreadyApplied ? (
          <Button label="지원 현황 보기" onPress={() => router.push('/(student)/(tabs)/applications')} variant="secondary" />
        ) : (
          <View style={styles.applyRow}>
            <Button
              label={job.isSaved ? '저장됨 ★' : '저장'}
              onPress={() => toggleSave.mutate({ jobId: job.id, saved: job.isSaved })}
              variant="ghost"
              size="md"
              fullWidth={false}
            />
            <View style={styles.applyButtonFlex}>
              <Button label="지원하기" onPress={() => router.push(`/(student)/apply/${job.id}`)} />
            </View>
          </View>
        )}
      </StickyBottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { ...typography.body2, color: colors.textTertiary },
  container: { padding: spacing.xl, gap: spacing.lg },
  summary: { ...typography.body2Bold, color: colors.primary },
  title: { ...typography.title1, color: colors.textPrimary },
  metaCard: {
    backgroundColor: colors.bgMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  metaLine: { ...typography.body1Bold, color: colors.textPrimary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.title2, color: colors.textPrimary },
  reasonText: { ...typography.body2, color: colors.primary },
  missingText: { ...typography.body2, color: colors.warning, marginTop: spacing.xxs },
  listText: { ...typography.body2, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  employerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  applyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  applyButtonFlex: { flex: 1 },
  disabledBlock: { gap: spacing.xs },
  disabledText: { ...typography.caption, color: colors.textTertiary },
});
