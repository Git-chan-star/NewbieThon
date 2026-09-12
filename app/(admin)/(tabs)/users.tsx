import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, StatusBadge } from '@/components/ui';
import { useAdminUsers, useSetUserActive } from '@/features/admin/useAdmin';
import { colors, radius, spacing, typography } from '@/theme';

const roleLabel = { student: '학생', employer: '구인자', admin: '관리자' } as const;

export default function AdminUsersScreen() {
  const users = useAdminUsers();
  const update = useSetUserActive();

  const confirm = (id: string, displayName: string, nextActive: boolean) => {
    Alert.alert(nextActive ? '회원 활성화' : '회원 정지', `${displayName} 계정을 ${nextActive ? '다시 활성화' : '정지'}할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: nextActive ? '활성화' : '정지', style: nextActive ? 'default' : 'destructive', onPress: () => update.mutate({ userId: id, isActive: nextActive }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>회원 관리</Text><Text style={styles.caption}>{users.data?.length ?? 0}명</Text></View>
      {users.isError ? <ErrorState onAction={() => users.refetch()} /> : (
        <FlatList
          data={users.data ?? []}
          keyExtractor={(item) => item.id}
          refreshing={users.isRefetching}
          onRefresh={users.refetch}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={<EmptyState title="가입한 회원이 없어요" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}><View style={styles.info}><Text style={styles.name}>{item.displayName}</Text><Text style={styles.meta}>{item.role ? roleLabel[item.role] : '역할 미선택'} · {new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text></View><StatusBadge label={item.isActive ? '활성' : '정지'} tone={item.isActive ? 'success' : 'danger'} /></View>
              {item.role !== 'admin' ? <Button label={item.isActive ? '계정 정지' : '계정 활성화'} variant={item.isActive ? 'danger' : 'secondary'} size="md" fullWidth={false} loading={update.isPending} onPress={() => confirm(item.id, item.displayName, !item.isActive)} /> : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, header: { padding: spacing.lg, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title1, color: colors.textPrimary }, caption: { ...typography.body2, color: colors.textSecondary }, list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }, info: { flex: 1, gap: spacing.xxs }, name: { ...typography.body1Bold, color: colors.textPrimary }, meta: { ...typography.body2, color: colors.textSecondary },
});
