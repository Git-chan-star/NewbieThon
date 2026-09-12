import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, ChoiceChip, StepHeader, StickyBottomAction, TextField } from '@/components/ui';
import type { DraftCourse, DraftProject } from '@/features/student/onboarding/onboardingStore';
import { useOnboardingStore } from '@/features/student/onboarding/onboardingStore';
import { mockStudentRepository } from '@/repositories/mock';
import { colors, spacing, typography } from '@/theme';

const PROJECT_SOURCES: { value: DraftProject['source']; label: string }[] = [
  { value: 'class', label: '수업' },
  { value: 'personal', label: '개인' },
  { value: 'club', label: '동아리' },
  { value: 'competition', label: '공모전' },
];

export default function ExperienceScreen() {
  const draft = useOnboardingStore((s) => s.draft);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);

  const [courses, setCourses] = useState<DraftCourse[]>(draft.courses);
  const [projects, setProjects] = useState<DraftProject[]>(draft.projects);

  const [courseName, setCourseName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [projectRole, setProjectRole] = useState('');
  const [projectSource, setProjectSource] = useState<DraftProject['source']>('class');

  const saveStep = useMutation({
    mutationFn: async () => {
      await Promise.all([
        ...courses.map((c) => mockStudentRepository.addCourse(c)),
        ...projects.map((p) =>
          mockStudentRepository.createProject({
            title: p.title,
            summary: p.summary,
            roleDescription: p.roleDescription,
            skillIds: p.skillIds,
            source: p.source,
          })
        ),
      ]);
    },
  });

  const addCourse = () => {
    if (!courseName.trim()) return;
    setCourses((prev) => [...prev, { courseName: courseName.trim(), completed: true }]);
    setCourseName('');
  };

  const addProject = () => {
    if (!projectTitle.trim() || !projectSummary.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        title: projectTitle.trim(),
        summary: projectSummary.trim(),
        roleDescription: projectRole.trim(),
        skillIds: draft.skills.map((s) => s.skillId),
        source: projectSource,
      },
    ]);
    setProjectTitle('');
    setProjectSummary('');
    setProjectRole('');
  };

  const onNext = () => {
    updateDraft({ courses, projects });
    saveStep.mutate(undefined, {
      onSuccess: () => router.push('/(auth)/student-onboarding/preferences'),
    });
  };

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <StepHeader
          currentStep={4}
          totalSteps={5}
          title="경험이 있다면 알려주세요"
          description="없어도 괜찮아요. 나중에 프로필에서 추가할 수 있어요."
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수강 과목</Text>
          <View style={styles.inlineForm}>
            <View style={styles.flexInput}>
              <TextField label="과목명" placeholder="예: 자료구조" value={courseName} onChangeText={setCourseName} />
            </View>
            <Button label="추가" onPress={addCourse} variant="secondary" size="md" fullWidth={false} />
          </View>
          {courses.map((c, idx) => (
            <Text key={`${c.courseName}-${idx}`} style={styles.listItem}>
              · {c.courseName}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로젝트</Text>
          <TextField label="프로젝트 제목" placeholder="예: 학과 커뮤니티 앱" value={projectTitle} onChangeText={setProjectTitle} />
          <TextField
            label="한 줄 설명"
            placeholder="어떤 프로젝트인지 짧게 설명해 주세요"
            value={projectSummary}
            onChangeText={setProjectSummary}
          />
          <TextField
            label="내가 담당한 부분"
            placeholder="예: 프론트엔드 화면 3개 구현"
            value={projectRole}
            onChangeText={setProjectRole}
          />
          <View>
            <Text style={styles.label}>출처</Text>
            <View style={styles.chipRow}>
              {PROJECT_SOURCES.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={projectSource === option.value}
                  onPress={() => setProjectSource(option.value)}
                />
              ))}
            </View>
          </View>
          <Button label="프로젝트 추가" onPress={addProject} variant="secondary" size="md" />
          {projects.map((p, idx) => (
            <Text key={`${p.title}-${idx}`} style={styles.listItem}>
              · {p.title}
            </Text>
          ))}
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
  container: { padding: spacing.xl, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.title2, color: colors.textPrimary },
  inlineForm: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flexInput: { flex: 1 },
  listItem: { ...typography.body2, color: colors.textSecondary },
  label: { ...typography.body2Bold, color: colors.textPrimary, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
