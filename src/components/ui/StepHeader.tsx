import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { ProgressBar } from './ProgressBar';

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
}

export function StepHeader({ currentStep, totalSteps, title, description }: StepHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>
        {currentStep} / {totalSteps} 단계
      </Text>
      <ProgressBar progress={currentStep / totalSteps} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.lg },
  stepLabel: { ...typography.captionBold, color: colors.textTertiary },
  title: { ...typography.title1, color: colors.textPrimary, marginTop: spacing.xs },
  description: { ...typography.body2, color: colors.textSecondary },
});
