import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchSize, primaryButtonHeight, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variantStyle(variant, isDisabled, pressed),
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.label, labelColor(variant, isDisabled)]}>{label}</Text>
      )}
    </Pressable>
  );
}

function variantStyle(variant: Variant, disabled: boolean, pressed: boolean) {
  if (disabled) {
    return { backgroundColor: colors.bgMuted };
  }
  switch (variant) {
    case 'primary':
      return { backgroundColor: pressed ? colors.primaryPressed : colors.primary };
    case 'danger':
      return { backgroundColor: pressed ? '#D93B47' : colors.danger };
    case 'secondary':
      return {
        backgroundColor: pressed ? colors.bgMuted : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'ghost':
      return { backgroundColor: pressed ? colors.bgMuted : 'transparent' };
    default:
      return {};
  }
}

function labelColor(variant: Variant, disabled: boolean) {
  if (disabled) return { color: colors.textDisabled };
  if (variant === 'primary' || variant === 'danger') return { color: colors.white };
  if (variant === 'secondary') return { color: colors.primary };
  return { color: colors.textPrimary };
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  lg: { minHeight: primaryButtonHeight },
  md: { minHeight: minTouchSize, paddingVertical: spacing.xs },
  fullWidth: { width: '100%' },
  label: { ...typography.body1Bold },
});
