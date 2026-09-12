import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, TextField } from '@/components/ui';
import { useStudentSearch } from '@/features/employer/useEmployer';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/theme';

export default function StudentSearchScreen() {
  const [keyword, setKeyword] = useState('');
  const debounced = useDebouncedValue(keyword, 300);
  const students = useStudentSearch(debounced);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>학생 찾기</Text><Text style={styles.subtitle}>학교나 전공명으로 공개 프로필을 찾아보세요.</Text><TextField label="학생 검색" placeholder="예: 컴퓨터학과" value={keyword} onChangeText={setKeyword} /></View>
      <FlatList data={students.data ?? []} keyExtractor={(item) => item.userId} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />} renderItem={({ item }) => <View style={styles.card}><Text style={styles.cardTitle}>{item.majorName || '전공 미입력'} · {item.gradeYear}학년</Text><Text style={styles.meta}>{item.schoolName}</Text><Text style={styles.bio}>{item.bio || item.interests.join(' · ') || '소개를 준비 중이에요.'}</Text></View>} ListEmptyComponent={<EmptyState title={keyword.length < 2 ? '검색어를 입력해 주세요' : '검색 결과가 없어요'} description="학생이 공개 설정한 프로필만 표시돼요." />} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, header: { padding: spacing.lg, gap: spacing.xs }, title: { ...typography.title1, color: colors.textPrimary }, subtitle: { ...typography.body2, color: colors.textSecondary, marginBottom: spacing.sm }, list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 }, card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xxs }, cardTitle: { ...typography.body1Bold, color: colors.textPrimary }, meta: { ...typography.body2, color: colors.textSecondary }, bio: { ...typography.body2, color: colors.textPrimary, marginTop: spacing.xs } });
