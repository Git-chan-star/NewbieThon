import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, ErrorState, SkillChip, StatusBadge, VerificationBadge } from '@/components/ui';
import { useSignOut } from '@/features/auth/hooks/useAuth';
import { useMyCourses, useMyProfile, useMyProjects, useMySkills } from '@/features/student/profile/useProfile';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockStudentRepository } from '@/repositories/mock';
import { studentKeys } from '@/lib/queryKeys';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOut();
  const profile = useMyProfile();
  const skills = useMySkills();
  const projects = useMyProjects();
  const courses = useMyCourses();
  const queryClient = useQueryClient();

  const toggleDiscoverable = useMutation({
    mutationFn: (isDiscoverable: boolean) => mockStudentRepository.updateProfile({ isDiscoverable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentKeys.profile() }),
  });

  if (profile.isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>불러오는 중이에요...</Text>
      </View>
    );
  }

  if (profile.isError) {
    return (
      <View style={styles.center}>
        <ErrorState onAction={() => profile.refetch()} />
      </View>
    );
  }

  if (!profile.data) {
    return (
      <View style={styles.center}>
        <EmptyState title="프로필 정보를 찾을 수 없어요" />
      </View>
    );
  }

  const data = profile.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{user?.displayName}</Text>
          <VerificationBadge verified={data.verificationStatus === 'verified'} />
        </View>
        <Text style={styles.schoolLine}>
          {data.schoolName} · {data.majorName} {data.gradeYear}학년
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관심 분야</Text>
          <View style={styles.badgeRow}>
            {data.interests.length > 0 ? (
              data.interests.map((i) => <StatusBadge key={i} label={i} tone="info" />)
            ) : (
              <Text style={styles.mutedText}>등록된 관심 분야가 없어요</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용 기술</Text>
          <View style={styles.badgeRow}>
            {(skills.data ?? []).length > 0 ? (
              skills.data!.map((s) => <SkillChip key={s.id} name={s.skillName} level={s.level} />)
            ) : (
              <Text style={styles.mutedText}>등록된 기술이 없어요</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수강 과목</Text>
          {(courses.data ?? []).length > 0 ? (
            courses.data!.map((c) => (
              <Text key={c.id} style={styles.listText}>
                · {c.courseName}
              </Text>
            ))
          ) : (
            <Text style={styles.mutedText}>등록된 과목이 없어요</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로젝트</Text>
          {(projects.data ?? []).length > 0 ? (
            projects.data!.map((p) => (
              <View key={p.id} style={styles.projectCard}>
                <Text style={styles.projectTitle}>{p.title}</Text>
                <Text style={styles.listText}>{p.summary}</Text>
                <Text style={styles.roleText}>내가 담당한 부분: {p.roleDescription || '기록 없음'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.mutedText}>등록된 프로젝트가 없어요</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>완료한 유료 업무</Text>
          <EmptyState title="아직 완료한 업무가 없어요" description="첫 업무를 완료하면 여기에 경험이 쌓여요." />
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>검색에 프로필 노출</Text>
              <Text style={styles.mutedText}>구인자가 인재 검색에서 나를 찾을 수 있어요</Text>
            </View>
            <Switch
              value={data.isDiscoverable}
              onValueChange={(value) => toggleDiscoverable.mutate(value)}
              accessibilityLabel="검색에 프로필 노출 여부"
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        <Button label="로그아웃" onPress={() => signOut.mutate()} variant="ghost" loading={signOut.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  mutedText: { ...typography.body2, color: colors.textTertiary },
  container: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.title1, color: colors.textPrimary },
  schoolLine: { ...typography.body1, color: colors.textSecondary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.title2, color: colors.textPrimary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  listText: { ...typography.body2, color: colors.textSecondary },
  projectCard: {
    backgroundColor: colors.bgMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  projectTitle: { ...typography.body1Bold, color: colors.textPrimary },
  roleText: { ...typography.caption, color: colors.textTertiary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
