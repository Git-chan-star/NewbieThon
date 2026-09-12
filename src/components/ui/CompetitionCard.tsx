import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Competition } from '@/domain/contracts/types';
import { formatDeadlineRemaining } from '@/lib/format';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { StatusBadge } from './StatusBadge';

export function CompetitionCard({ competition, onPress }: { competition: Competition; onPress: () => void }) {
  return <Pressable style={styles.card} onPress={onPress} accessibilityRole="button"><Text style={styles.title}>{competition.title}</Text><Text style={styles.organizer}>{competition.organizerName}</Text><Text style={styles.summary} numberOfLines={2}>{competition.summary}</Text><View style={styles.badges}>{competition.categories.slice(0, 2).map((category) => <StatusBadge key={category} label={category} tone="info" />)}{competition.locationText ? <StatusBadge label={competition.locationText} /> : null}</View><Text style={styles.deadline}>{formatDeadlineRemaining(competition.applicationDeadline) ?? '마감일 확인 필요'}</Text></Pressable>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs, ...shadow.card }, title: { ...typography.body1Bold, color: colors.textPrimary }, organizer: { ...typography.body2, color: colors.textSecondary }, summary: { ...typography.body2, color: colors.textPrimary }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs }, deadline: { ...typography.captionBold, color: colors.primary, marginTop: spacing.xxs } });
