import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, ChoiceChip, TextField } from '@/components/ui';
import { useCompleteOnboarding } from '@/features/auth/hooks/useAuth';
import { useEmployerOnboarding } from '@/features/employer/useEmployer';
import { colors, spacing, typography } from '@/theme';

const TYPES = ['개인', '스타트업', '기업', '학교·연구실', '비영리'] as const;

export default function EmployerOnboardingScreen() {
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<(typeof TYPES)[number]>('스타트업');
  const [contactName, setContactName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [introduction, setIntroduction] = useState('');
  const onboarding = useEmployerOnboarding();
  const complete = useCompleteOnboarding();

  const canSubmit = organizationName.trim() && contactName.trim() && workEmail.includes('@');
  const submit = () => {
    if (!canSubmit) return;
    onboarding.mutate(
      { organizationName, organizationType, contactName, workEmail, introduction },
      {
        onSuccess: () => complete.mutate(undefined, { onSuccess: () => router.replace('/(employer)/(tabs)') }),
      }
    );
  };

  const error = onboarding.error ?? complete.error;
  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>구인 정보를 알려주세요</Text>
        <Text style={styles.subtitle}>학생이 안심하고 지원할 수 있도록 필요한 내용만 받아요.</Text>
      </View>
      <TextField label="조직·상호명" placeholder="예: 전공픽 스튜디오" value={organizationName} onChangeText={setOrganizationName} required />
      <View style={styles.field}>
        <Text style={styles.label}>구인자 유형</Text>
        <View style={styles.chips}>
          {TYPES.map((type) => <ChoiceChip key={type} label={type} selected={organizationType === type} onPress={() => setOrganizationType(type)} />)}
        </View>
      </View>
      <TextField label="담당자명" placeholder="예: 김담당" value={contactName} onChangeText={setContactName} required />
      <TextField label="업무 이메일" placeholder="work@example.com" value={workEmail} onChangeText={setWorkEmail} autoCapitalize="none" keyboardType="email-address" required />
      <TextField label="한 줄 소개" placeholder="어떤 곳인지 짧게 알려주세요" value={introduction} onChangeText={setIntroduction} multiline style={styles.multiline} />
      {error ? <Text style={styles.error}>{(error as Error).message}</Text> : null}
      <Button label="구인자 프로필 만들기" onPress={submit} disabled={!canSubmit} loading={onboarding.isPending || complete.isPending} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.lg },
  heading: { gap: spacing.xs, marginBottom: spacing.sm },
  title: { ...typography.title1, color: colors.textPrimary },
  subtitle: { ...typography.body2, color: colors.textSecondary },
  field: { gap: spacing.xs },
  label: { ...typography.body2Bold, color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  multiline: { height: 96, textAlignVertical: 'top' },
  error: { ...typography.body2, color: colors.danger },
});
