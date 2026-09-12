import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, StatusBadge, TextField } from '@/components/ui';
import { useApplyToTeam, useRespondToTeamApplication, useTeam, useTeamApplications } from '@/features/competitions/useCompetitions';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const team = useTeam(id);
  const applications = useTeamApplications(id);
  const respond = useRespondToTeamApplication(id);
  const apply = useApplyToTeam();
  const [selectedOpening, setSelectedOpening] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  if (!team.data) return null;
  const isLeader = team.data.leaderId === user?.id;
  const submit = () => selectedOpening && apply.mutate({ openingId: selectedOpening, message }, { onSuccess: () => { setSelectedOpening(null); setMessage(''); } });
  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.heading}><View style={styles.titleRow}><Text style={styles.title}>{team.data.name}</Text><StatusBadge label={team.data.status === 'recruiting' ? '모집 중' : '모집 완료'} tone="success" /></View><Text style={styles.body}>{team.data.introduction}</Text><Text style={styles.member}>현재 {team.data.memberCount}명</Text></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>모집 역할</Text>{team.data.openings.map((opening) => <View key={opening.id} style={styles.card}><View style={styles.titleRow}><Text style={styles.role}>{opening.roleName}</Text><Text style={styles.count}>{opening.filledCount}/{opening.headcount}명</Text></View><Text style={styles.body}>{opening.description}</Text><Text style={styles.skills}>{opening.skillNames.join(' · ')}</Text>{!isLeader && opening.filledCount < opening.headcount ? <Button label={selectedOpening === opening.id ? '선택됨' : '이 역할로 지원'} variant={selectedOpening === opening.id ? 'primary' : 'secondary'} size="md" onPress={() => setSelectedOpening(opening.id)} /> : null}</View>)}</View>
    {!isLeader && selectedOpening ? <View style={styles.applyBox}><Text style={styles.sectionTitle}>팀장에게 한마디</Text><TextField label="지원 메시지" placeholder="할 수 있는 것과 함께하고 싶은 이유를 알려주세요" value={message} onChangeText={setMessage} multiline style={styles.multiline} /><Button label="팀 합류 지원하기" onPress={submit} disabled={!message.trim()} loading={apply.isPending} />{apply.isSuccess ? <Text style={styles.success}>지원이 전달됐어요.</Text> : null}</View> : null}
    {isLeader ? <View style={styles.section}><Text style={styles.sectionTitle}>팀 지원자</Text>{!applications.data?.length ? <EmptyState title="아직 지원자가 없어요" description="지원이 오면 여기서 수락하거나 거절할 수 있어요." /> : applications.data.map((application) => <View key={application.id} style={styles.card}><Text style={styles.role}>지원자</Text><Text style={styles.body}>{application.message}</Text><StatusBadge label={application.status === 'pending' ? '검토 중' : application.status === 'accepted' ? '수락' : '거절'} tone="info" />{application.status === 'pending' ? <View style={styles.buttons}><View style={styles.flex}><Button label="거절" variant="secondary" size="md" onPress={() => respond.mutate({ applicationId: application.id, accept: false })} /></View><View style={styles.flex}><Button label="팀원으로 수락" size="md" onPress={() => respond.mutate({ applicationId: application.id, accept: true })} /></View></View> : null}</View>)}</View> : null}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl }, heading: { gap: spacing.xs }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }, title: { ...typography.title1, color: colors.textPrimary, flex: 1 }, body: { ...typography.body2, color: colors.textSecondary }, member: { ...typography.body2Bold, color: colors.primary }, section: { gap: spacing.sm }, sectionTitle: { ...typography.title2, color: colors.textPrimary }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs }, role: { ...typography.body1Bold, color: colors.textPrimary }, count: { ...typography.captionBold, color: colors.primary }, skills: { ...typography.captionBold, color: colors.primary }, applyBox: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }, multiline: { height: 100, textAlignVertical: 'top' }, success: { ...typography.body2Bold, color: colors.success }, buttons: { flexDirection: 'row', gap: spacing.xs }, flex: { flex: 1 } });
