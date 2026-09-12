import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface SelectCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectCard({ title, description, selected, onPress }: SelectCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
  },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  texts: { flex: 1, gap: spacing.xxs },
  title: { ...typography.body1Bold, color: colors.textPrimary },
  description: { ...typography.body2, color: colors.textSecondary },
});
