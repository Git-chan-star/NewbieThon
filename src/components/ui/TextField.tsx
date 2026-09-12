import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  errorMessage?: string;
  required?: boolean;
  helperText?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, errorMessage, required, helperText, style, ...rest },
  ref
) {
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        style={[styles.input, hasError && styles.inputError, style]}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
        accessibilityState={{ disabled: rest.editable === false }}
        {...rest}
      />
      {hasError ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  label: { ...typography.body2Bold, color: colors.textPrimary },
  required: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: colors.textPrimary,
    minHeight: 44,
    height: 52,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger },
  helperText: { ...typography.caption, color: colors.textTertiary },
});
