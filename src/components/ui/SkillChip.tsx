import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SkillLevel } from '@/domain/contracts/types';
import { colors, radius, spacing, typography } from '@/theme';

const levelShortLabel: Record<SkillLevel, string> = {
  learned: '배움',
  basic: '기초',
  project_used: '프로젝트',
  work_ready: '업무 가능',
};

interface SkillChipProps {
  name: string;
  level: SkillLevel;
  onRemove?: () => void;
}

export function SkillChip({ name, level, onRemove }: SkillChipProps) {
  return (
    <View style={styles.chip} accessible accessibilityLabel={`${name}, ${levelShortLabel[level]}`}>
      <Text style={styles.text}>
        {name} · {levelShortLabel[level]}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${name} 삭제`}
          style={styles.removeButton}
        >
          <Text style={styles.removeText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.pill,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  text: { ...typography.body2Bold, color: colors.textPrimary },
  removeButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.textTertiary, fontSize: 12 },
});
