import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} accessible accessibilityRole="text">
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" size="md" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = '문제가 발생했어요',
  description = '네트워크 상태를 확인하고 다시 시도해 주세요.',
  actionLabel = '다시 시도',
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  return <EmptyState title={title} description={description} actionLabel={actionLabel} onAction={onAction} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  title: { ...typography.body1Bold, color: colors.textPrimary, textAlign: 'center' },
  description: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' },
  action: { marginTop: spacing.md },
});
