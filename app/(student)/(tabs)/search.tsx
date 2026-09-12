import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChoiceChip, CompetitionCard, EmptyState, ErrorState, JobCard, SkeletonJobCard, TextField } from '@/components/ui';
import type { Job } from '@/domain/contracts/types';
import { useSavedJobs, useSearchJobs, useToggleSaveJob } from '@/features/student/jobs/useJobs';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useCompetitions } from '@/features/competitions/useCompetitions';
import { colors, spacing, typography } from '@/theme';

const CATEGORY_OPTIONS = ['개발', '데이터·AI', '디자인·UI·UX', '기획·리서치', '콘텐츠·마케팅'];
const DIFFICULTY_OPTIONS: { value: Job['difficulty']; label: string }[] = [
  { value: 'beginner', label: '입문' },
  { value: 'basic', label: '기초' },
  { value: 'intermediate', label: '중급' },
];
const WORK_MODE_OPTIONS: { value: Job['workMode']; label: string }[] = [
  { value: 'remote', label: '재택' },
  { value: 'onsite', label: '대면' },
  { value: 'hybrid', label: '혼합' },
];

type Segment = 'search' | 'competitions' | 'saved';

export default function SearchScreen() {
  const [segment, setSegment] = useState<Segment>('search');
  const [competitionKeyword, setCompetitionKeyword] = useState('');
  const debouncedCompetitionKeyword = useDebouncedValue(competitionKeyword, 300);
  const competitions = useCompetitions(debouncedCompetitionKeyword);
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const [category, setCategory] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<Job['difficulty'] | undefined>();
  const [workMode, setWorkMode] = useState<Job['workMode'] | undefined>();
  const [beginnerFriendlyOnly, setBeginnerFriendlyOnly] = useState(false);

  const query = useMemo(
    () => ({ keyword: debouncedKeyword, category, difficulty, workMode, beginnerFriendlyOnly }),
    [debouncedKeyword, category, difficulty, workMode, beginnerFriendlyOnly]
  );

  const results = useSearchJobs(query);
  const jobs = useMemo(() => results.data?.pages.flatMap((p) => p.items) ?? [], [results.data]);

  const savedJobs = useSavedJobs();
  const savedJobItems = useMemo(() => savedJobs.data?.pages.flatMap((p) => p.items) ?? [], [savedJobs.data]);
  const toggleSave = useToggleSaveJob();

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (category) activeFilters.push({ key: 'category', label: category, clear: () => setCategory(undefined) });
  if (difficulty)
    activeFilters.push({
      key: 'difficulty',
      label: DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label ?? difficulty,
      clear: () => setDifficulty(undefined),
    });
  if (workMode)
    activeFilters.push({
      key: 'workMode',
      label: WORK_MODE_OPTIONS.find((w) => w.value === workMode)?.label ?? workMode,
      clear: () => setWorkMode(undefined),
    });
  if (beginnerFriendlyOnly)
    activeFilters.push({ key: 'beginner', label: '저학년 가능', clear: () => setBeginnerFriendlyOnly(false) });

  const clearAll = () => {
    setCategory(undefined);
    setDifficulty(undefined);
    setWorkMode(undefined);
    setBeginnerFriendlyOnly(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.segmentRow}>
        <ChoiceChip label="전공 일거리" selected={segment === 'search'} onPress={() => setSegment('search')} />
        <ChoiceChip label="대회·팀 찾기" selected={segment === 'competitions'} onPress={() => setSegment('competitions')} />
        <ChoiceChip
          label={`저장한 공고 ${savedJobItems.length > 0 ? savedJobItems.length : ''}`.trim()}
          selected={segment === 'saved'}
          onPress={() => setSegment('saved')}
        />
      </View>

      {segment === 'search' ? (
        <>
      <View style={styles.searchBar}>
        <TextField
          label="공고 검색"
          placeholder="어떤 업무를 찾고 있나요?"
          value={keyword}
          onChangeText={setKeyword}
          accessibilityLabel="공고 검색"
        />
      </View>

      <View style={styles.filterBlock}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_OPTIONS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <ChoiceChip
              label={item}
              selected={category === item}
              onPress={() => setCategory(category === item ? undefined : item)}
            />
          )}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={DIFFICULTY_OPTIONS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <ChoiceChip
              label={item.label}
              selected={difficulty === item.value}
              onPress={() => setDifficulty(difficulty === item.value ? undefined : item.value)}
            />
          )}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={WORK_MODE_OPTIONS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <ChoiceChip
              label={item.label}
              selected={workMode === item.value}
              onPress={() => setWorkMode(workMode === item.value ? undefined : item.value)}
            />
          )}
          ListFooterComponent={
            <ChoiceChip
              label="저학년 가능"
              selected={beginnerFriendlyOnly}
              onPress={() => setBeginnerFriendlyOnly((v) => !v)}
            />
          }
        />

        {activeFilters.length > 0 ? (
          <View style={styles.activeFilterRow}>
            {activeFilters.map((filter) => (
              <Pressable key={filter.key} onPress={filter.clear} style={styles.activeChip}>
                <Text style={styles.activeChipText}>{filter.label} ✕</Text>
              </Pressable>
            ))}
            <Pressable onPress={clearAll} hitSlop={8}>
              <Text style={styles.clearAllText}>전체 초기화</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (results.hasNextPage) results.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => router.push(`/(student)/job/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          results.isLoading ? (
            <View style={{ gap: spacing.sm }}>
              <SkeletonJobCard />
              <SkeletonJobCard />
            </View>
          ) : results.isError ? (
            <ErrorState onAction={() => results.refetch()} />
          ) : (
            <EmptyState
              title="조건에 맞는 공고가 없어요"
              description="필터를 완화하거나 초기화해 보세요."
              actionLabel={activeFilters.length > 0 ? '필터 초기화' : undefined}
              onAction={activeFilters.length > 0 ? clearAll : undefined}
            />
          )
        }
      />
        </>
      ) : segment === 'competitions' ? (
        <View style={styles.competitionPane}>
          <View style={styles.searchBar}>
            <TextField label="대회 검색" placeholder="해커톤, 공모전, 관심 기술" value={competitionKeyword} onChangeText={setCompetitionKeyword} />
          </View>
          <FlatList
            data={competitions.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => <CompetitionCard competition={item} onPress={() => router.push(`/(student)/competition/${item.id}`)} />}
            ListEmptyComponent={<EmptyState title="조건에 맞는 대회가 없어요" description="다른 키워드로 다시 찾아보세요." />}
          />
        </View>
      ) : (
        <FlatList
          data={savedJobItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (savedJobs.hasNextPage) savedJobs.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/(student)/job/${item.id}`)}
              onToggleSave={() => toggleSave.mutate({ jobId: item.id, saved: true })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            savedJobs.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                <SkeletonJobCard />
                <SkeletonJobCard />
              </View>
            ) : savedJobs.isError ? (
              <ErrorState onAction={() => savedJobs.refetch()} />
            ) : (
              <EmptyState
                title="저장한 공고가 없어요"
                description="관심 있는 공고를 저장하면 여기서 모아볼 수 있어요."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  competitionPane: { flex: 1 },
  segmentRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  searchBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  filterBlock: { paddingTop: spacing.sm, gap: spacing.xs },
  filterRow: { paddingHorizontal: spacing.xl, gap: spacing.xs },
  activeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxs,
  },
  activeChip: { backgroundColor: colors.primaryMuted, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  activeChipText: { ...typography.caption, color: colors.primary },
  clearAllText: { ...typography.captionBold, color: colors.textTertiary },
  listContent: { padding: spacing.xl, paddingTop: spacing.sm, flexGrow: 1 },
});
