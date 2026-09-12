import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMessages, useSendMessage } from '@/features/messages/useMessages';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function ConversationScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const user = useAuthStore((state) => state.user);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const [body, setBody] = useState('');
  const submit = () => {
    const text = body.trim();
    if (!text) return;
    send.mutate(text, { onSuccess: () => setBody('') });
  };
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title} numberOfLines={1}>{title ?? '대화'}</Text><View style={styles.headerSpace} /></View>
    <FlatList data={messages.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => { const mine = item.senderId === user?.id || item.senderId === 'mock-user'; return <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={[styles.message, mine && styles.mineText]}>{item.body}</Text></View>; }} ListEmptyComponent={<Text style={styles.empty}>첫 메시지를 보내 대화를 시작해 보세요.</Text>} />
    <View style={styles.composer}><TextInput style={styles.input} value={body} onChangeText={setBody} placeholder="메시지 입력" placeholderTextColor={colors.textTertiary} multiline /><Pressable style={[styles.send, !body.trim() && styles.sendDisabled]} onPress={submit} disabled={!body.trim() || send.isPending}><Text style={styles.sendText}>전송</Text></Pressable></View>
  </KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, header: { height: 58, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }, back: { fontSize: 36, color: colors.textPrimary, lineHeight: 38 }, title: { ...typography.body1Bold, color: colors.textPrimary, flex: 1, textAlign: 'center' }, headerSpace: { width: 20 }, list: { padding: spacing.lg, gap: spacing.xs, flexGrow: 1 }, bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, mine: { alignSelf: 'flex-end', backgroundColor: colors.primary }, theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, message: { ...typography.body2, color: colors.textPrimary }, mineText: { color: colors.white }, empty: { ...typography.body2, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xxxl }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }, input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: radius.xl, backgroundColor: colors.bgMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body2, color: colors.textPrimary }, send: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primary, justifyContent: 'center' }, sendDisabled: { opacity: 0.4 }, sendText: { ...typography.body2Bold, color: colors.white } });
