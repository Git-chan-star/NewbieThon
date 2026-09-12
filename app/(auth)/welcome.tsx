import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.brandIcon}><Text style={styles.brandIconText}>잇</Text></View>
        <Text style={styles.brand}>잇구</Text>
        <Text style={styles.title}>지금 배우는 전공으로{'\n'}첫 유료 업무를 시작해요</Text>
        <Text style={styles.subtitle}>이력서가 없어도 괜찮아요. 수업, 프로젝트, 할 수 있는 기술만으로 시작할 수 있어요.</Text>
      </View>

      <View style={styles.actions}>
        <Button label="시작하기" onPress={() => router.push('/(auth)/sign-up')} />
        <Button
          label="이미 계정이 있어요"
          onPress={() => router.push('/(auth)/sign-in')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  hero: { marginTop: spacing.xxxl, gap: spacing.sm },
  brandIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryMuted },
  brandIconText: { ...typography.title1, color: colors.primary },
  brand: { ...typography.display, color: colors.textPrimary },
  title: { ...typography.hero, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body1, color: colors.textSecondary },
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
});
