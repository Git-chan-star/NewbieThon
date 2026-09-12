import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, TextField } from '@/components/ui';
import { useCreateTeam } from '@/features/competitions/useCompetitions';
import { colors, spacing, typography } from '@/theme';

export default function CreateTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [roleName, setRoleName] = useState('');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');
  const createTeam = useCreateTeam();
  const canSubmit = name.trim() && introduction.trim() && roleName.trim();
  const submit = () => createTeam.mutate({ competitionId: id, name, introduction, openings: [{ roleName, description, skillNames: skills.split(',').map((item) => item.trim()).filter(Boolean), headcount: 1 }] }, { onSuccess: (team) => router.replace(`/(student)/team/${team.id}`) });
  return <KeyboardAwareScrollView contentContainerStyle={styles.container}><View style={styles.heading}><Text style={styles.title}>어떤 팀을 만들까요?</Text><Text style={styles.subtitle}>팀 소개와 지금 필요한 역할 하나만 먼저 등록해요.</Text></View><TextField label="팀 이름" placeholder="예: 새싹메이커스" value={name} onChangeText={setName} required /><TextField label="팀 소개" placeholder="아이디어와 일하는 방식을 알려주세요" value={introduction} onChangeText={setIntroduction} multiline style={styles.multiline} required /><View style={styles.divider} /><Text style={styles.sectionTitle}>첫 모집 역할</Text><TextField label="역할명" placeholder="예: Android 개발" value={roleName} onChangeText={setRoleName} required /><TextField label="필요 기술" helperText="쉼표로 구분해 주세요" placeholder="React Native, TypeScript" value={skills} onChangeText={setSkills} /><TextField label="함께 할 일" placeholder="맡게 될 일을 간단히 알려주세요" value={description} onChangeText={setDescription} />{createTeam.isError ? <Text style={styles.error}>{(createTeam.error as Error).message}</Text> : null}<Button label="팀 모집 시작하기" onPress={submit} disabled={!canSubmit} loading={createTeam.isPending} /></KeyboardAwareScrollView>;
}
const styles = StyleSheet.create({ container: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.lg }, heading: { gap: spacing.xs }, title: { ...typography.title1, color: colors.textPrimary }, subtitle: { ...typography.body2, color: colors.textSecondary }, multiline: { height: 108, textAlignVertical: 'top' }, divider: { height: 1, backgroundColor: colors.border }, sectionTitle: { ...typography.title2, color: colors.textPrimary }, error: { ...typography.body2, color: colors.danger } });
