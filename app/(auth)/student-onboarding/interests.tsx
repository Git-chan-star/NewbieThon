import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChoiceChip, StepHeader, StickyBottomAction, Button } from '@/components/ui';
import { useOnboardingStore } from '@/features/student/onboarding/onboardingStore';
import { studentRepository } from '@/repositories';
import { colors, spacing, typography } from '@/theme';

const INTEREST_OPTIONS = ['개발', '데이터·AI', '디자인·UI·UX', '기획·리서치', '콘텐츠·마케팅', '기타'];
const MAX_SELECT = 3;

export default function InterestsScreen() {
  const draft = useOnboardingStore((s) => s.draft);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);
  const [interests, setInterests] = useState<string[]>(draft.interests);

  const saveStep = useMutation({
    mutationFn: () => studentRepository.saveOnboardingStep({ interests }),
  });

  const toggle = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, interest];
    });
  };

  const onNext = () => {
    if (interests.length === 0) return;
    updateDraft({ interests });
    saveStep.mutate(undefined, {
      onSuccess: () => router.push('/(auth)/student-onboarding/skills'),
    });
  };

  return (
    <View style={styles.flex}>
      <View style={styles.container}>
        <StepHeader
          currentStep={2}
          totalSteps={5}
          title="관심 있는 분야를 골라주세요"
          description={`최소 1개, 최대 ${MAX_SELECT}개까지 선택할 수 있어요.`}
        />
        <View style={styles.chipRow}>
          {INTEREST_OPTIONS.map((interest) => (
            <ChoiceChip
              key={interest}
              label={interest}
              selected={interests.includes(interest)}
              onPress={() => toggle(interest)}
              disabled={!interests.includes(interest) && interests.length >= MAX_SELECT}
            />
          ))}
        </View>
        <Text style={styles.helper}>{interests.length} / {MAX_SELECT}개 선택됨</Text>
      </View>

      <StickyBottomAction>
        <Button label="다음" onPress={onNext} disabled={interests.length === 0} loading={saveStep.isPending} />
      </StickyBottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  container: { padding: spacing.xl, gap: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  helper: { ...typography.caption, color: colors.textTertiary },
});
