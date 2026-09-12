import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, StatusBadge, StepHeader, StickyBottomAction, TextField } from '@/components/ui';
import { useSubmitApplication } from '@/features/student/applications/useApplications';
import { useJobDetail } from '@/features/student/jobs/useJobs';
import { useMyCourses, useMyProfile, useMyProjects, useMySkills } from '@/features/student/profile/useProfile';
import { colors, radius, spacing, typography } from '@/theme';

const TOTAL_STEPS = 3;

export default function ApplyScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { data: job } = useJobDetail(jobId);
  const { data: profile } = useMyProfile();
  const { data: skills } = useMySkills();
  const { data: projects } = useMyProjects();
  const { data: courses } = useMyCourses();

  const [step, setStep] = useState(1);
  const [availableStartDate, setAvailableStartDate] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [shortAnswer, setShortAnswer] = useState('');

  const submitApplication = useSubmitApplication();

  if (!job) return null;

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const onSubmit = () => {
    submitApplication.mutate(
      { jobId: job.id, availableStartDate: availableStartDate || undefined, availabilityNote: availabilityNote || undefined, shortAnswer: shortAnswer || undefined },
      {
        onSuccess: () => {
          router.replace('/(student)/(tabs)/applications');
        },
      }
    );
  };

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <StepHeader
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          title={
            step === 1
              ? '제출될 프로필을 확인해 주세요'
              : step === 2
                ? '시작 가능일과 일정을 알려주세요'
                : '마지막으로 확인해 주세요'
          }
          description={job.title}
        />

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>학교·전공</Text>
            <Text style={styles.cardValue}>
              {profile ? `${profile.schoolName} · ${profile.majorName} ${profile.gradeYear}학년` : '정보 없음'}
            </Text>

            <Text style={styles.cardLabel}>기술</Text>
            <View style={styles.badgeRow}>
              {(skills ?? []).length > 0 ? (
                (skills ?? []).map((s) => <StatusBadge key={s.id} label={s.skillName} tone="info" />)
              ) : (
                <Text style={styles.cardValue}>등록된 기술이 없어요</Text>
              )}
            </View>

            <Text style={styles.cardLabel}>프로젝트</Text>
            <Text style={styles.cardValue}>
              {(projects ?? []).length > 0 ? projects!.map((p) => p.title).join(', ') : '등록된 프로젝트가 없어요'}
            </Text>

            <Text style={styles.cardLabel}>수강 과목</Text>
            <Text style={styles.cardValue}>
              {(courses ?? []).length > 0 ? courses!.map((c) => c.courseName).join(', ') : '등록된 과목이 없어요'}
            </Text>

            <Text style={styles.helperText}>기본 정보와 프로젝트는 다시 입력할 필요 없어요. 프로필 화면에서 수정할 수 있어요.</Text>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <TextField
              label="시작 가능일"
              placeholder="예: 2026-09-25"
              value={availableStartDate}
              onChangeText={setAvailableStartDate}
              helperText="정확한 날짜를 몰라도 대략적으로 입력해도 괜찮아요"
            />
            <TextField
              label="일정 관련 메모 (선택)"
              placeholder="예: 평일 오후에 시간이 많아요"
              value={availabilityNote}
              onChangeText={setAvailabilityNote}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <TextField
              label="공고에 궁금한 점이나 하고 싶은 말 (선택)"
              placeholder="짧게 적어주세요"
              value={shortAnswer}
              onChangeText={setShortAnswer}
              multiline
            />

            <View style={styles.card}>
              <Text style={styles.cardLabel}>제출되는 정보</Text>
              <Text style={styles.cardValue}>프로필 스냅샷, 시작 가능일, 추가 메모</Text>
              <Text style={styles.cardLabel}>예상 연락 방법</Text>
              <Text style={styles.cardValue}>구인자가 확인 후 메시지로 연락드려요</Text>
              <Text style={styles.cardLabel}>지원 취소</Text>
              <Text style={styles.cardValue}>지원 현황에서 언제든 취소할 수 있어요</Text>
            </View>

            {submitApplication.isError ? (
              <Text style={styles.errorText}>{(submitApplication.error as Error).message}</Text>
            ) : null}
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <StickyBottomAction>
        <View style={styles.buttonRow}>
          <View style={styles.backButton}>
            <Button label={step === 1 ? '취소' : '이전'} onPress={goBack} variant="ghost" size="lg" />
          </View>
          <View style={styles.nextButton}>
            {step < TOTAL_STEPS ? (
              <Button label="다음" onPress={goNext} />
            ) : (
              <Button label="지원 완료하기" onPress={onSubmit} loading={submitApplication.isPending} />
            )}
          </View>
        </View>
      </StickyBottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, gap: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardLabel: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm },
  cardValue: { ...typography.body1Bold, color: colors.textPrimary },
  helperText: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  section: { gap: spacing.md },
  errorText: { ...typography.body2, color: colors.danger },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});
