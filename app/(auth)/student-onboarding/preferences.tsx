import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, ChoiceChip, StepHeader, StickyBottomAction, TextField } from '@/components/ui';
import type { WorkMode } from '@/domain/contracts/types';
import { useOnboardingStore } from '@/features/student/onboarding/onboardingStore';
import { studentRepository } from '@/repositories';
import { colors, spacing, typography } from '@/theme';

const CATEGORY_OPTIONS = ['개발', '데이터·AI', '디자인·UI·UX', '기획·리서치', '콘텐츠·마케팅', '기타'];
const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: 'remote', label: '재택' },
  { value: 'onsite', label: '대면' },
  { value: 'hybrid', label: '혼합' },
];
const DAY_OPTIONS = ['월', '화', '수', '목', '금', '토', '일'];

export default function PreferencesScreen() {
  const draft = useOnboardingStore((s) => s.draft);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);

  const [categories, setCategories] = useState<string[]>(
    draft.preferredJobCategories.length > 0 ? draft.preferredJobCategories : draft.interests
  );
  const [workModes, setWorkModes] = useState<WorkMode[]>(draft.preferredWorkModes);
  const [days, setDays] = useState<string[]>(draft.availableDays);
  const [hours, setHours] = useState(draft.availableHoursPerWeek ? String(draft.availableHoursPerWeek) : '');

  const saveStep = useMutation({
    mutationFn: () =>
      studentRepository.saveOnboardingStep({
        preferredJobCategories: categories,
        preferredWorkModes: workModes,
        availableDays: days,
        availableHoursPerWeek: hours ? Number(hours) : undefined,
      }),
  });

  const toggle = <T,>(list: T[], setList: (v: T[]) => void, value: T) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const canProceed = categories.length > 0 && workModes.length > 0;

  const onNext = () => {
    if (!canProceed) return;
    updateDraft({
      preferredJobCategories: categories,
      preferredWorkModes: workModes,
      availableDays: days,
      availableHoursPerWeek: hours ? Number(hours) : undefined,
    });
    saveStep.mutate(undefined, {
      onSuccess: () => router.push('/(auth)/student-onboarding/complete'),
    });
  };

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <StepHeader currentStep={5} totalSteps={5} title="희망하는 업무 조건을 알려주세요" />

        <View style={styles.section}>
          <Text style={styles.label}>관심 업무 분야</Text>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <ChoiceChip key={c} label={c} selected={categories.includes(c)} onPress={() => toggle(categories, setCategories, c)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>희망 업무 형태</Text>
          <View style={styles.chipRow}>
            {WORK_MODE_OPTIONS.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                selected={workModes.includes(option.value)}
                onPress={() => toggle(workModes, setWorkModes, option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>가능한 요일</Text>
          <View style={styles.chipRow}>
            {DAY_OPTIONS.map((day) => (
              <ChoiceChip key={day} label={day} selected={days.includes(day)} onPress={() => toggle(days, setDays, day)} />
            ))}
          </View>
        </View>

        <TextField
          label="주당 가능 시간"
          placeholder="예: 10"
          keyboardType="number-pad"
          value={hours}
          onChangeText={setHours}
          helperText="시간 단위로 입력해 주세요"
        />
      </KeyboardAwareScrollView>

      <StickyBottomAction>
        <Button label="다음" onPress={onNext} disabled={!canProceed} loading={saveStep.isPending} />
      </StickyBottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, gap: spacing.xl },
  section: { gap: spacing.sm },
  label: { ...typography.body2Bold, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
