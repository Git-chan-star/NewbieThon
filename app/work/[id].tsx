import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StatusBadge, TextField } from '@/components/ui';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCompleteWork, useRequestRevision, useStartWork, useSubmitDeliverable, useWork } from '@/features/work/useWork';
import { colors, radius, spacing, typography } from '@/theme';

const labels: Record<string, string> = { ready: '시작 전', in_progress: '진행 중', submitted: '결과물 검토 중', revision_requested: '수정 요청됨', completed: '완료', canceled: '취소', disputed: '확인 필요' };
export default function WorkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useAuthStore((state) => state.user?.role);
  const work = useWork(id);
  const start = useStartWork(id);
  const submit = useSubmitDeliverable(id);
  const revision = useRequestRevision(id);
  const complete = useCompleteWork(id);
  const [title, setTitle] = useState('최종 결과물');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  if (!work.data) return null;
  const item = work.data;
  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.container}><View style={styles.heading}><Text style={styles.title}>{item.jobTitle}</Text><StatusBadge label={labels[item.status]} tone={item.status === 'completed' ? 'success' : 'info'} /><Text style={styles.scope}>{item.agreedScope}</Text></View><View style={styles.card}><Text style={styles.sectionTitle}>합의한 결과물</Text>{item.agreedDeliverables.map((value) => <Text key={value} style={styles.body}>· {value}</Text>)}</View>{item.deliverables.map((value) => <View key={value.id} style={styles.card}><Text style={styles.sectionTitle}>{value.title}</Text><Text style={styles.body}>{value.note}</Text>{value.externalUrl ? <Text style={styles.link}>{value.externalUrl}</Text> : null}</View>)}
    {role === 'employer' && item.status === 'ready' ? <Button label="업무 시작 확정" onPress={() => start.mutate([])} loading={start.isPending} /> : null}
    {role === 'student' && ['in_progress', 'revision_requested'].includes(item.status) ? <View style={styles.form}><Text style={styles.sectionTitle}>결과물 제출</Text><TextField label="제목" value={title} onChangeText={setTitle} /><TextField label="결과물 링크" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" /><TextField label="설명" value={note} onChangeText={setNote} multiline style={styles.multiline} /><Button label="검토 요청하기" onPress={() => submit.mutate([title, note, url])} disabled={!title.trim()} loading={submit.isPending} /></View> : null}
    {role === 'employer' && item.status === 'submitted' ? <View style={styles.form}><TextField label="수정 요청 내용" value={note} onChangeText={setNote} placeholder="수정이 필요한 내용을 구체적으로 알려주세요" /><View style={styles.buttons}><View style={styles.flex}><Button label="수정 요청" variant="secondary" onPress={() => revision.mutate([note])} disabled={!note.trim()} /></View><View style={styles.flex}><Button label="업무 완료" onPress={() => complete.mutate([])} /></View></View></View> : null}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl }, heading: { gap: spacing.sm }, title: { ...typography.title1, color: colors.textPrimary }, scope: { ...typography.body1, color: colors.textSecondary }, card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs }, sectionTitle: { ...typography.title2, color: colors.textPrimary }, body: { ...typography.body2, color: colors.textSecondary }, link: { ...typography.body2Bold, color: colors.primary }, form: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }, multiline: { height: 96, textAlignVertical: 'top' }, buttons: { flexDirection: 'row', gap: spacing.xs }, flex: { flex: 1 } });
