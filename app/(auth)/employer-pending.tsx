import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useSignOut } from '@/features/auth/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';

export default function EmployerPendingScreen() {
  const signOut = useSignOut();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>구인자 화면은 준비 중이에요</Text>
        <Text style={styles.subtitle}>
          구인자 온보딩과 공고 관리 화면은 다른 팀원이 개발하고 있어요. 곧 만나볼 수 있어요.
        </Text>
      </View>
      <Button label="로그아웃" onPress={() => signOut.mutate()} variant="ghost" loading={signOut.isPending} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'space-between' },
  content: { marginTop: spacing.xxxl, gap: spacing.sm },
  title: { ...typography.title1, color: colors.textPrimary },
  subtitle: { ...typography.body1, color: colors.textSecondary },
});
