import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>메시지</Text>
      </View>
      <View style={styles.body}>
        <EmptyState
          title="아직 대화가 없어요"
          description="제안을 수락하거나 구인자가 대화를 시작하면 여기에 표시돼요."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { ...typography.title1, color: colors.textPrimary },
  body: { flex: 1, justifyContent: 'center' },
});
