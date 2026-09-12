import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StatusBadge } from '@/components/ui';
import { useCompleteOnboarding } from '@/features/auth/hooks/useAuth';
import { useOnboardingStore } from '@/features/student/onboarding/onboardingStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function OnboardingCompleteScreen() {
  const draft = useOnboardingStore((s) => s.draft);
  const reset = useOnboardingStore((s) => s.reset);
  const completeOnboarding = useCompleteOnboarding();

  const onStart = () => {
    completeOnboarding.mutate(undefined, {
      onSuccess: () => {
        reset();
        router.replace('/');
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>프로필 준비가 끝났어요</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>학교·전공</Text>
          <Text style={styles.cardValue}>
            {draft.schoolName} · {draft.majorName} {draft.gradeYear}학년
          </Text>

          <Text style={styles.cardLabel}>관심 분야</Text>
          <View style={styles.badgeRow}>
            {draft.interests.map((i) => (
              <StatusBadge key={i} label={i} tone="info" />
            ))}
          </View>

          <Text style={styles.cardLabel}>기술</Text>
          <Text style={styles.cardValue}>
            {draft.skills.length > 0 ? draft.skills.map((s) => s.skillName).join(', ') : '아직 등록하지 않았어요'}
          </Text>

          <Text style={styles.cardLabel}>희망 근무 방식</Text>
          <Text style={styles.cardValue}>
            {draft.preferredWorkModes.length > 0 ? draft.preferredWorkModes.join(', ') : '미선택'}
          </Text>
        </View>
      </View>

      <Button label="내게 맞는 업무 보기" onPress={onStart} loading={completeOnboarding.isPending} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'space-between' },
  content: { gap: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  emoji: { fontSize: 40 },
  title: { ...typography.title1, color: colors.textPrimary, textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cardLabel: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm },
  cardValue: { ...typography.body1Bold, color: colors.textPrimary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
});
