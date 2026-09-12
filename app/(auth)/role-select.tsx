import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SelectCard } from '@/components/ui';
import { useSelectRole } from '@/features/auth/hooks/useAuth';
import type { UserRole } from '@/domain/contracts/types';
import { colors, spacing, typography } from '@/theme';

export default function RoleSelectScreen() {
  const [selected, setSelected] = useState<Exclude<UserRole, 'admin'> | null>(null);
  const selectRole = useSelectRole();

  const onConfirm = () => {
    if (!selected) return;
    selectRole.mutate(selected, {
      onSuccess: () => router.replace('/'),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>어떤 역할로 시작할까요?</Text>
        <Text style={styles.subtitle}>선택한 역할에 맞는 화면을 보여드려요.</Text>

        <View style={styles.cards}>
          <SelectCard
            title="학생이에요"
            description="전공을 활용할 수 있는 업무를 찾고 싶어요"
            icon="🎓"
            selected={selected === 'student'}
            onPress={() => setSelected('student')}
          />
          <SelectCard
            title="구인자예요"
            description="전공 대학생에게 업무를 맡기고 싶어요"
            icon="🏢"
            selected={selected === 'employer'}
            onPress={() => setSelected('employer')}
          />
        </View>
      </View>

      <View style={styles.footer}>
        {selectRole.isError ? (
          <Text style={styles.errorText}>{(selectRole.error as Error).message}</Text>
        ) : null}
        <Button label="선택 완료" onPress={onConfirm} disabled={!selected} loading={selectRole.isPending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.sm },
  title: { ...typography.title1, color: colors.textPrimary },
  subtitle: { ...typography.body2, color: colors.textSecondary, marginBottom: spacing.md },
  cards: { gap: spacing.sm },
  footer: { padding: spacing.lg, gap: spacing.xs },
  errorText: { ...typography.body2, color: colors.danger },
});
