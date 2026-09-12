import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, StatusBadge } from '@/components/ui';
import { useCompetition } from '@/features/competitions/useCompetitions';
import { formatKoreanDate } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function CompetitionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const competition = useCompetition(id);
  if (competition.isError) return <ErrorState onAction={() => competition.refetch()} />;
  if (!competition.data) return null;
  const item = competition.data;
  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.heading}><Text style={styles.organizer}>{item.organizerName}</Text><Text style={styles.title}>{item.title}</Text><Text style={styles.summary}>{item.summary}</Text><View style={styles.badges}>{item.categories.map((category) => <StatusBadge key={category} label={category} tone="info" />)}</View></View>
    <View style={styles.infoCard}><Text style={styles.info}>📅 접수 마감  {formatKoreanDate(item.applicationDeadline) ?? '확인 필요'}</Text>{item.locationText ? <Text style={styles.info}>📍 {item.locationText}</Text> : null}<Text style={styles.info}>🧩 {item.requiredSkills.join(' · ') || '기술 제한 없음'}</Text></View>
    {item.description ? <View style={styles.section}><Text style={styles.sectionTitle}>대회 소개</Text><Text style={styles.body}>{item.description}</Text></View> : null}
    {item.sourceUrl ? <Button label="공식 공고 보기" variant="secondary" onPress={() => Linking.openURL(item.sourceUrl!)} /> : null}
    <View style={styles.actionRow}><View style={styles.flex}><Button label="팀 만들기" onPress={() => router.push(`/(student)/competition/${item.id}/create-team`)} /></View></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>모집 중인 팀 {item.teams.length}</Text>{item.teams.length === 0 ? <EmptyState title="아직 모집 중인 팀이 없어요" description="첫 팀을 만들고 필요한 팀원을 찾아보세요." /> : item.teams.map((team) => <Pressable key={team.id} style={styles.teamCard} onPress={() => router.push(`/(student)/team/${team.id}`)}><View style={styles.teamHeader}><Text style={styles.teamName}>{team.name}</Text><StatusBadge label={team.status === 'recruiting' ? '모집 중' : '모집 완료'} tone={team.status === 'recruiting' ? 'success' : 'neutral'} /></View><Text style={styles.body} numberOfLines={2}>{team.introduction}</Text><Text style={styles.skills}>찾는 역할: {team.openings.filter((opening) => opening.filledCount < opening.headcount).map((opening) => opening.roleName).join(' · ') || '모집 완료'}</Text></Pressable>)}</View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl }, heading: { gap: spacing.xs }, organizer: { ...typography.body2Bold, color: colors.primary }, title: { ...typography.title1, color: colors.textPrimary }, summary: { ...typography.body1, color: colors.textSecondary }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs }, infoCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm }, info: { ...typography.body2, color: colors.textPrimary }, section: { gap: spacing.sm }, sectionTitle: { ...typography.title2, color: colors.textPrimary }, body: { ...typography.body2, color: colors.textSecondary }, actionRow: { flexDirection: 'row' }, flex: { flex: 1 }, teamCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs }, teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }, teamName: { ...typography.body1Bold, color: colors.textPrimary }, skills: { ...typography.captionBold, color: colors.primary } });
