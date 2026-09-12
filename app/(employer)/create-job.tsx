import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, ChoiceChip, TextField } from '@/components/ui';
import type { WorkMode } from '@/domain/contracts/types';
import { useCreateJob } from '@/features/employer/useEmployer';
import { colors, spacing, typography } from '@/theme';

const MODES: { value: WorkMode; label: string }[] = [{ value: 'remote', label: '재택' }, { value: 'onsite', label: '대면' }, { value: 'hybrid', label: '혼합' }];
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export default function CreateJobScreen() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('개발');
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('remote');
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('10');
  const [compensation, setCompensation] = useState('150000');
  const [beginnerFriendly, setBeginnerFriendly] = useState(true);
  const [feedback, setFeedback] = useState(true);
  const createJob = useCreateJob();
  const canSubmit = useMemo(() => title.trim() && summary.trim() && tasks.trim() && deliverables.trim() && (workMode === 'remote' || location.trim()), [title, summary, tasks, deliverables, workMode, location]);
  const submit = () => {
    if (!canSubmit) return;
    createJob.mutate({
      title: title.trim(), category, summary: summary.trim(),
      responsibilities: tasks.split('\n').map((item) => item.trim()).filter(Boolean),
      deliverables: deliverables.split('\n').map((item) => item.trim()).filter(Boolean),
      workMode, locationText: workMode === 'remote' ? undefined : location.trim(),
      startDate: addDays(7), endDate: addDays(37), applicationDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      compensationType: 'fixed', compensationMin: Number(compensation), hoursPerWeek: Number(hours), headcount: 1,
      beginnerFriendly, educationOrFeedback: feedback,
    }, { onSuccess: (job) => router.replace(`/(employer)/job/${job.id}`) });
  };
  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.heading}><Text style={styles.title}>학생이 바로 이해하는 공고</Text><Text style={styles.subtitle}>한 화면에서 핵심 조건만 작성하면 바로 모집을 시작해요.</Text></View>
      <TextField label="공고 제목" placeholder="예: Android 로그인 화면 개선" value={title} onChangeText={setTitle} required />
      <TextField label="분야" placeholder="개발, 데이터·AI, 디자인" value={category} onChangeText={setCategory} required />
      <TextField label="업무 한 줄 소개" placeholder="무엇을 왜 하는 일인지 알려주세요" value={summary} onChangeText={setSummary} required />
      <TextField label="할 일" helperText="여러 개라면 줄을 바꿔 입력하세요" placeholder={'기존 화면 확인\n로그인 UI 수정'} value={tasks} onChangeText={setTasks} multiline style={styles.multiline} required />
      <TextField label="결과물" placeholder={'소스 코드\n간단한 작업 설명'} value={deliverables} onChangeText={setDeliverables} multiline style={styles.multiline} required />
      <View style={styles.field}><Text style={styles.label}>업무 방식</Text><View style={styles.row}>{MODES.map((mode) => <ChoiceChip key={mode.value} label={mode.label} selected={workMode === mode.value} onPress={() => setWorkMode(mode.value)} />)}</View></View>
      {workMode !== 'remote' ? <TextField label="업무 장소" placeholder="예: 서울 성북구" value={location} onChangeText={setLocation} required /> : null}
      <View style={styles.twoColumns}><View style={styles.column}><TextField label="주당 예상 시간" value={hours} onChangeText={setHours} keyboardType="number-pad" /></View><View style={styles.column}><TextField label="건별 보수(원)" value={compensation} onChangeText={setCompensation} keyboardType="number-pad" /></View></View>
      <View style={styles.switchRow}><View style={styles.switchText}><Text style={styles.label}>저학년 지원 가능</Text><Text style={styles.hint}>경력보다 학습 의지와 기본기를 봐요.</Text></View><Switch value={beginnerFriendly} onValueChange={setBeginnerFriendly} trackColor={{ true: colors.primary }} /></View>
      <View style={styles.switchRow}><View style={styles.switchText}><Text style={styles.label}>피드백 제공</Text><Text style={styles.hint}>업무 후 학생의 성장을 위한 피드백을 남겨요.</Text></View><Switch value={feedback} onValueChange={setFeedback} trackColor={{ true: colors.primary }} /></View>
      {createJob.isError ? <Text style={styles.error}>{(createJob.error as Error).message}</Text> : null}
      <Button label="공고 게시하기" onPress={submit} disabled={!canSubmit} loading={createJob.isPending} />
    </KeyboardAwareScrollView>
  );
}
const styles = StyleSheet.create({ container: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 }, heading: { gap: spacing.xs }, title: { ...typography.title1, color: colors.textPrimary }, subtitle: { ...typography.body2, color: colors.textSecondary }, multiline: { height: 96, textAlignVertical: 'top' }, field: { gap: spacing.xs }, label: { ...typography.body2Bold, color: colors.textPrimary }, row: { flexDirection: 'row', gap: spacing.xs }, twoColumns: { flexDirection: 'row', gap: spacing.sm }, column: { flex: 1 }, switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, switchText: { flex: 1, gap: 2 }, hint: { ...typography.caption, color: colors.textSecondary }, error: { ...typography.body2, color: colors.danger } });
