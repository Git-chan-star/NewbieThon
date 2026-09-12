import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, StatusBadge } from '@/components/ui';
import { useConversations } from '@/features/messages/useMessages';
import { colors, radius, spacing, typography } from '@/theme';

export default function MessagesScreen() {
  const conversations = useConversations();
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><Text style={styles.title}>메시지</Text><Text style={styles.subtitle}>업무와 대회 팀 대화를 한곳에서 확인해요.</Text></View><FlatList data={conversations.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />} renderItem={({ item }) => <Pressable style={styles.card} onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id, title: item.title } })}><View style={styles.icon}><Text>{item.kind === 'team' ? '👥' : '💼'}</Text></View><View style={styles.text}><View style={styles.row}><Text style={styles.name} numberOfLines={1}>{item.title}</Text><StatusBadge label={item.kind === 'team' ? '팀' : '업무'} tone="info" /></View><Text style={styles.preview} numberOfLines={1}>{item.preview}</Text></View></Pressable>} ListEmptyComponent={<EmptyState title="아직 대화가 없어요" description="업무 제안을 수락하거나 팀원이 되면 대화방이 열려요." />} /></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, header: { padding: spacing.lg, gap: spacing.xxs }, title: { ...typography.title1, color: colors.textPrimary }, subtitle: { ...typography.body2, color: colors.textSecondary }, list: { padding: spacing.lg, flexGrow: 1 }, card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, icon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }, text: { flex: 1, gap: spacing.xxs }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, name: { ...typography.body1Bold, color: colors.textPrimary, flex: 1 }, preview: { ...typography.body2, color: colors.textSecondary } });
