import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { ChoiceChip, StatusBadge, StepHeader, StickyBottomAction, TextField, Button } from '@/components/ui';
import { useOnboardingStore } from '@/features/student/onboarding/onboardingStore';
import { studentRepository } from '@/repositories';
import { colors, spacing, typography } from '@/theme';

const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export default function BasicInfoScreen() {
  const draft = useOnboardingStore((s) => s.draft);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);

  const [schoolName, setSchoolName] = useState(draft.schoolName);
  const [majorName, setMajorName] = useState(draft.majorName);
  const [gradeYear, setGradeYear] = useState<(typeof GRADE_OPTIONS)[number]>(draft.gradeYear);
  const [touched, setTouched] = useState(false);

  const saveStep = useMutation({
    mutationFn: () =>
      studentRepository.saveOnboardingStep({
        schoolName,
        majorName,
        gradeYear,
        verificationStatus: 'unverified',
      }),
  });

  const canProceed = schoolName.trim().length > 0 && majorName.trim().length > 0;

  const onNext = () => {
    setTouched(true);
    if (!canProceed) return;
    updateDraft({ schoolName, majorName, gradeYear });
    saveStep.mutate(undefined, {
      onSuccess: () => router.push('/(auth)/student-onboarding/interests'),
    });
  };

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <StepHeader
          currentStep={1}
          totalSteps={5}
          title="어느 학교, 어떤 전공인가요?"
          description="맞춤 업무를 찾기 위한 기본 정보예요."
        />

        <View style={styles.form}>
          <TextField
            label="학교명"
            placeholder="예: 고려대학교"
            required
            value={schoolName}
            onChangeText={setSchoolName}
            errorMessage={touched && !schoolName.trim() ? '학교명을 입력해 주세요.' : undefined}
          />
          <TextField
            label="전공명"
            placeholder="예: 컴퓨터학과"
            required
            value={majorName}
            onChangeText={setMajorName}
            errorMessage={touched && !majorName.trim() ? '전공명을 입력해 주세요.' : undefined}
          />

          <View>
            <Text style={styles.label}>학년</Text>
            <View style={styles.chipRow}>
              {GRADE_OPTIONS.map((grade) => (
                <ChoiceChip
                  key={grade}
                  label={`${grade}학년`}
                  selected={gradeYear === grade}
                  onPress={() => setGradeYear(grade)}
                />
              ))}
            </View>
          </View>

          <View style={styles.verificationRow}>
            <Text style={styles.verificationText}>학교 이메일 인증은 나중에 해도 괜찮아요</Text>
            <StatusBadge label="미인증" />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <StickyBottomAction>
        <Button label="다음" onPress={onNext} loading={saveStep.isPending} />
      </StickyBottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, gap: spacing.lg },
  form: { gap: spacing.lg },
  label: { ...typography.body2Bold, color: colors.textPrimary, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgMuted,
    borderRadius: 12,
    padding: spacing.md,
  },
  verificationText: { ...typography.body2, color: colors.textSecondary, flex: 1, marginRight: spacing.sm },
});
