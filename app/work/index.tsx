import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, StatusBadge } from '@/components/ui';
import { useWorkList } from '@/features/work/useWork';
import { colors, radius, spacing, typography } from '@/theme';

const labels: Record<string, string> = { ready: '시작 전', in_progress: '진행 중', submitted: '결과물 검토', revision_requested: '수정 요청', completed: '완료', canceled: '취소', disputed: '확인 필요' };
export default function WorkListScreen() {
  const work = useWorkList();
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>업무 관리</Text><View style={styles.space} /></View><FlatList data={work.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />} renderItem={({ item }) => <Pressable style={styles.card} onPress={() => router.push(`/work/${item.id}`)}><View style={styles.row}><Text style={styles.name}>{item.jobTitle}</Text><StatusBadge label={labels[item.status]} tone={item.status === 'completed' ? 'success' : 'info'} /></View><Text style={styles.scope} numberOfLines={2}>{item.agreedScope}</Text></Pressable>} ListEmptyComponent={<EmptyState title="진행 중인 업무가 없어요" description="지원이 수락되고 조건이 확정되면 여기에서 업무를 관리해요." />} /></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, header: { height: 58, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface }, back: { fontSize: 36, color: colors.textPrimary }, title: { ...typography.body1Bold, color: colors.textPrimary, flex: 1, textAlign: 'center' }, space: { width: 20 }, list: { padding: spacing.lg, flexGrow: 1 }, card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, name: { ...typography.body1Bold, color: colors.textPrimary, flex: 1 }, scope: { ...typography.body2, color: colors.textSecondary } });
