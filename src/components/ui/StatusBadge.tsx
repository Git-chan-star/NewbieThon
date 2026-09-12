import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, toneStyle(tone)]} accessible accessibilityLabel={label}>
      <Text style={[styles.text, toneTextStyle(tone)]}>{label}</Text>
    </View>
  );
}

export function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <StatusBadge
      label={verified ? '✓ 인증됨' : '미인증'}
      tone={verified ? 'success' : 'neutral'}
    />
  );
}

function toneStyle(tone: Tone) {
  switch (tone) {
    case 'success':
      return { backgroundColor: colors.successMuted };
    case 'warning':
      return { backgroundColor: colors.warningMuted };
    case 'danger':
      return { backgroundColor: colors.dangerMuted };
    case 'info':
      return { backgroundColor: colors.primaryMuted };
    default:
      return { backgroundColor: colors.bgMuted };
  }
}

function toneTextStyle(tone: Tone) {
  switch (tone) {
    case 'success':
      return { color: colors.success };
    case 'warning':
      return { color: colors.warning };
    case 'danger':
      return { color: colors.danger };
    case 'info':
      return { color: colors.primary };
    default:
      return { color: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  text: { ...typography.captionBold },
});
