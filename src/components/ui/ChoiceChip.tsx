import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/theme';

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function ChoiceChip({ label, selected, onPress, disabled }: ChoiceChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={[styles.chip, selected ? styles.selected : styles.unselected, disabled && styles.disabled]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  selected: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surface, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  label: { ...typography.body2Bold },
  labelSelected: { color: colors.primary },
  labelUnselected: { color: colors.textSecondary },
});
