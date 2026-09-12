import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Job, MatchExplanation } from '@/domain/contracts/types';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { formatCompensation, formatDifficulty, formatHours, formatWorkMode } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

interface JobCardProps {
  job: Job;
  match?: MatchExplanation;
  matchReasons?: string[];
  saved?: boolean;
  onPress: () => void;
  onToggleSave?: () => void;
}

export function JobCard({ job, match, matchReasons, saved, onPress, onToggleSave }: JobCardProps) {
  const requiredSkills = job.requiredSkills.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${job.employerName}`}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.employer} numberOfLines={1}>
            {job.employerName}
            {job.employerVerified ? ' · 인증' : ''}
          </Text>
        </View>
        {onToggleSave ? (
          <Pressable
            onPress={onToggleSave}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={saved ? '저장 취소' : '공고 저장'}
            accessibilityState={{ selected: saved }}
            style={styles.saveButton}
          >
            <Text style={[styles.saveIcon, saved && styles.saveIconActive]}>{saved ? '★' : '☆'}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.badgeRow}>
        <StatusBadge label={job.category} tone="info" />
        <StatusBadge label={formatDifficulty(job.difficulty)} />
        <StatusBadge label={formatWorkMode(job.workMode)} />
        {job.beginnerFriendly ? <StatusBadge label="저학년 가능" tone="success" /> : null}
      </View>

      <View style={styles.metaRow}>
        {formatHours(job) ? <Text style={styles.metaText}>{formatHours(job)}</Text> : null}
        <Text style={styles.metaText}>{formatCompensation(job)}</Text>
      </View>

      {requiredSkills.length > 0 ? (
        <Text style={styles.skillsText} numberOfLines={1}>
          필요 기술: {requiredSkills.map((s) => s.skillName).join(', ')}
        </Text>
      ) : null}

      {matchReasons && matchReasons.length > 0 ? (
        <View style={styles.matchBox}>
          {matchReasons.slice(0, 2).map((reason) => (
            <Text key={reason} style={styles.matchText}>
              · {reason}
            </Text>
          ))}
        </View>
      ) : null}

      {match && match.missingRequiredSkillNames.length > 0 ? (
        <Text style={styles.missingText}>
          지원 전에 확인해 주세요: {match.missingRequiredSkillNames.join(', ')} 필요
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { flex: 1, gap: 2, paddingRight: spacing.sm },
  title: { ...typography.body1Bold, color: colors.textPrimary },
  employer: { ...typography.body2, color: colors.textSecondary },
  saveButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  saveIcon: { fontSize: 22, color: colors.textTertiary },
  saveIconActive: { color: colors.warning },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxs },
  metaText: { ...typography.body2Bold, color: colors.textPrimary },
  skillsText: { ...typography.caption, color: colors.textSecondary },
  matchBox: { marginTop: spacing.xxs, gap: 2 },
  matchText: { ...typography.caption, color: colors.primary },
  missingText: { ...typography.caption, color: colors.warning, marginTop: spacing.xxs },
});
