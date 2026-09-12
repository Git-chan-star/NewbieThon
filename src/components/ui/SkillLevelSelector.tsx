import { StyleSheet, Text, View } from 'react-native';
import type { SkillLevel } from '@/domain/contracts/types';
import { colors, spacing, typography } from '@/theme';
import { ChoiceChip } from './ChoiceChip';

const LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'learned', label: '수업에서 배웠어요' },
  { value: 'basic', label: '간단히 사용할 수 있어요' },
  { value: 'project_used', label: '프로젝트에 사용해 봤어요' },
  { value: 'work_ready', label: '실제 업무에 활용할 수 있어요' },
];

interface SkillLevelSelectorProps {
  skillName: string;
  value?: SkillLevel;
  onChange: (level: SkillLevel) => void;
}

export function SkillLevelSelector({ skillName, value, onChange }: SkillLevelSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{skillName}</Text>
      <View style={styles.options}>
        {LEVEL_OPTIONS.map((option) => (
          <ChoiceChip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingVertical: spacing.sm },
  name: { ...typography.body1Bold, color: colors.textPrimary },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
