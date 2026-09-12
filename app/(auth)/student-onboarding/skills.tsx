import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  ChoiceChip,
  SkillChip,
  SkillLevelSelector,
  StepHeader,
  StickyBottomAction,
  TextField,
} from '@/components/ui';
import { SKILL_CATALOG } from '@/repositories/mock/data/skills';
import type { DraftSkill } from '@/features/student/onboarding/onboardingStore';
import { useOnboardingStore } from '@/features/student/onboarding/onboardingStore';
import { studentRepository } from '@/repositories';
import { colors, spacing, typography } from '@/theme';

export default function SkillsScreen() {
  const draft = useOnboardingStore((s) => s.draft);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);
  const [skills, setSkills] = useState<DraftSkill[]>(draft.skills);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const chosenIds = new Set(skills.map((s) => s.skillId));
    const q = query.trim().toLowerCase();
    return SKILL_CATALOG.filter((item) => !chosenIds.has(item.id)).filter((item) =>
      q ? item.name.toLowerCase().includes(q) : draft.interests.includes(item.category)
    ).slice(0, 12);
  }, [query, skills, draft.interests]);

  const saveStep = useMutation({
    mutationFn: async () => {
      await Promise.all(
        skills.map((s) => studentRepository.upsertSkill({ skillId: s.skillId, skillName: s.skillName, level: s.level }))
      );
    },
  });

  const addSkill = (skillId: string, skillName: string) => {
    setSkills((prev) => [...prev, { skillId, skillName, level: 'basic' }]);
  };

  const removeSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  const updateLevel = (skillId: string, level: DraftSkill['level']) => {
    setSkills((prev) => prev.map((s) => (s.skillId === skillId ? { ...s, level } : s)));
  };

  const onNext = () => {
    updateDraft({ skills });
    saveStep.mutate(undefined, {
      onSuccess: () => router.push('/(auth)/student-onboarding/experience'),
    });
  };

  return (
    <View style={styles.flex}>
      <FlatList
        contentContainerStyle={styles.container}
        data={skills}
        keyExtractor={(item) => item.skillId}
        ListHeaderComponent={
          <View style={styles.header}>
            <StepHeader
              currentStep={3}
              totalSteps={5}
              title="사용할 수 있는 기술을 골라주세요"
              description="수준은 자의적인 점수가 아니라 문구로 표현해요."
            />
            <TextField label="기술 검색" placeholder="예: React, Figma" value={query} onChangeText={setQuery} />
            {suggestions.length > 0 ? (
              <View style={styles.suggestionRow}>
                {suggestions.map((item) => (
                  <ChoiceChip key={item.id} label={item.name} selected={false} onPress={() => addSkill(item.id, item.name)} />
                ))}
              </View>
            ) : null}
            {skills.length > 0 ? <Text style={styles.sectionTitle}>선택한 기술과 수준</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.selectedItem}>
            <View style={styles.selectedHeader}>
              <SkillChip name={item.skillName} level={item.level} onRemove={() => removeSkill(item.skillId)} />
            </View>
            <SkillLevelSelector
              skillName="수준 선택"
              value={item.level}
              onChange={(level) => updateLevel(item.skillId, level)}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>아직 선택한 기술이 없어요. 위에서 검색하거나 추천 목록에서 골라보세요.</Text>
        }
      />

      <StickyBottomAction>
        <Button label="다음" onPress={onNext} loading={saveStep.isPending} />
      </StickyBottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
  header: { gap: spacing.md },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sectionTitle: { ...typography.body1Bold, color: colors.textPrimary, marginTop: spacing.sm },
  selectedItem: { gap: spacing.xs, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectedHeader: { flexDirection: 'row' },
  emptyText: { ...typography.body2, color: colors.textTertiary, marginTop: spacing.md },
});
